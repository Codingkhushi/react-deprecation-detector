import { Block, ClassDeclaration, FileReference, MethodDeclaration, Project, SyntaxKind } from "ts-morph";
import { Issue } from "./detector";
import { fileURLToPath } from "url";

interface Fix{
    api : string;
    file : string;
    line : number;
    before : string;
    after : string;
    type : "remove" | "move-to-constructor" | "rename" | "manual-review";
    confidence : "high" | "medium" | "low";
    urgency ?: "high" | "medium" | "low";
}

type Pattern =
    'empty' |
    'setState-only' |
    'async' |
    'complex' |
    'simple-logging' |
    'simple-side-effect' |
    'unsafe-prefix';


function classifyLifeCycleMethod(methodName : string ,method : MethodDeclaration) : Pattern{
    const body = method.getBody() as Block;
    if(!body) return "empty"

    const statement = body.getStatements();
    if(statement.length === 0) return "empty";

    // Check for UNSAFE_ prefix first
    if(methodName.startsWith("UNSAFE_")) return "unsafe-prefix";

    switch (methodName){
        case "componentWillMount" :
            return classifyComponentWillMount(method);

        case "componentWillReceiveProps":
            return classifyComponentWillReceiveProps(method);
        
        case "componentWillUpdate" :
            return classifyComponentWillUpdate(method);

        default :
            return "complex";    
    }

}
function classifyComponentWillMount(method : MethodDeclaration) : Pattern {
    //If there are no statements inside, it’s just an empty lifecycle → can safely delete.
    const body = method.getBody() as Block;
    if(!body) return "empty";

    const statement = body.getStatements();
    if(statement.length === 0) return "empty";

    //Checks for patterns inside the method
    const bodyText = body.getText();

    // SAFETY CHECK 1: Nested objects in setState
    const hasNestedObjects = bodyText.includes('this.setState') &&
                                    /\{\s*\w+\s*:\s*\{/.test(bodyText); // Matches { key: { ... }

    if(hasNestedObjects){
        return "complex";
    }
    // SAFETY CHECK 2: Inline comments
    const hasInlineComments = bodyText.includes('this.setState') &&
                                bodyText.includes('//') &&
                                bodyText.match(/\/\/.*\n/);
    if(hasInlineComments){
        return "complex";
    }

    const hasAsync = bodyText.includes("async") || bodyText.includes("fetch") || bodyText.includes("axios") || bodyText.includes("then") || bodyText.includes("Promise");

    const hasSetState = bodyText.includes("this.setState");
    const hasOtherCode = bodyText.includes('console.') || 
                    bodyText.includes('return') ||
                    bodyText.includes('if (') ||
                    bodyText.includes('for ') ||
                    statement.length > 2;

    const statementCount = statement.length;
    if( hasSetState && !hasOtherCode ){
        return "setState-only";
    }
    // Simple side effects
            const isSimpleSideEffect = statement.length <= 2 && 
            !hasSetState && 
            !hasAsync &&
            bodyText.length < 150;

    if(hasAsync ||  isSimpleSideEffect){
        return "async";
    }
    if(statementCount > 3 && bodyText.length > 200){
        return "complex";
    }
    return "complex";
}

function classifyComponentWillReceiveProps(method : MethodDeclaration) : Pattern {
    const body = method.getBody() as Block;
    if(!body) return "empty";

    const bodyText = body.getText();
    const statement = body.getStatements();

    const simpleLogging = statement.length <= 3 && (bodyText.includes("console.log") || bodyText.includes("debugger")) &&
    !bodyText.includes("setState") && !bodyText.match(/this\.props\.\w+\s*(!==|===|!=|==)/);

    if(simpleLogging){
        return "simple-logging";
    }

    const hasConditionalSetState = bodyText.includes("setState") && bodyText.includes("nextProps") && (bodyText.includes("this.props") || bodyText.includes("if"));

    if(hasConditionalSetState){
        return "complex";
    }
    return 'complex';
}
function classifyComponentWillUpdate(method : MethodDeclaration) : Pattern {
    const body = method.getBody() as Block;
    if(!body) return "empty";

    const bodyText = body.getText();
    const statement = body.getStatements();

    const isSimpleSideEffect = statement.length <= 3 &&
                                !bodyText.includes("document") &&
                                !bodyText.includes("setState") &&
                                !bodyText.includes("window.") &&
                                !bodyText.includes("refs") ;


    if(isSimpleSideEffect){
        return "simple-side-effect";
    }
    return "complex";
}

function extractSetStateCalls(method : MethodDeclaration) : Record<string,string> | null {
    const body = method.getBody() as Block;
    if(!body) return null;

    const bodyText = body.getText();

    const setStatePatterns = /this\.setState\(\s*\{([\s\S]*?)\}\s*\)/g;
    const matches = [...bodyText.matchAll(setStatePatterns)];

    if(matches.length === 0) return null;

    //result dictionary 
    const stateProps : Record<string,string> = {};

    matches.forEach(match => {
        const propsText = match[1];

        // Parse line by line to preserve comments
        const lines = propsText.split('\n').map(l => l.trim()).filter(l => l);

        //split by comma but be careful with nested objects
        // const props = splitStateProps(propsText);

        lines.forEach( line => {
             // Skip pure comment lines
            if (line.startsWith('//')) return;
            const colonIndex = line.indexOf(":");
            if(colonIndex !== -1){
                const key = line.substring(0,colonIndex).trim();
                let value = line.substring(colonIndex+1).trim();

                // Remove trailing comma
                value = value.replace(/,$/, '');

                if(key && value){
                    stateProps[key] = value;
                }
            }
        });
    });
    return Object.keys(stateProps).length > 0 ? stateProps : null;
}

function extractSetStateCallsFromAST(method : MethodDeclaration) : string | null {
    const body = method.getBody() as Block;
    if(!body) return null;
    const setStateCalls = body.getDescendantsOfKind(SyntaxKind.CallExpression).filter(call =>{ 
        const exp = call.getExpression();
        return exp.getText().includes("this.state");
    });
    //you’re now holding all the this.setState(...) calls in that method.
    //If no setState calls exist, there’s nothing to extract — so you safely exit early.
    if(setStateCalls.length === 0) return null;
    
    //You now have the first setState call in the method 
//  this takes the first call instead of looping through all of them.
// (It’s a simplification — later you might handle multiple calls in a loop.)
    const firstArgument = setStateCalls[0];

    const args = firstArgument.getArguments();
    if(args.length === 0) return null;

    const objectLiteral = args[0];
    //returning 
    return objectLiteral.getText();

}

function splitStateProps(propsText : string): string[]{
    // Simple splitter - handles basic cases
    const props : string[] = [];
    let current = "";
    let depth = 0;
    for(let i =0 ;i<propsText.length;i++){
        const char = propsText[i];
        if(char === "{" || char === "[") depth++ ;
        if(char === "}" || char === "]") depth-- ;
        if(char === "," && depth === 0){
            props.push(current.trim());
            current = "";
        }else{
            current += char;
        }
    }
    if(current.trim()){
        props.push(current.trim());
    }
    return props;
}

function formatStateObject(stateProps : Record<string,string>) : string {
    const entries = Object.entries(stateProps);
    if(entries.length === 0){
        return "{}";
    }
    // Check if any value has inline comments
    const hasComments = entries.some(([_, v]) => v.includes('//'));
    if (hasComments) {
        // Multi-line format to preserve comments
        const props = entries
            .map(([key, value]) => `    ${key}: ${value}`)
            .join(',\n');
            
            return `{\n${props}\n  }`;
        } else {
            // Single line format
            const props = entries
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        return `{${entries}}`;
    }
}

function findOrCreateConstructor(classDecl : ClassDeclaration,stateProps : Record<string,string>) : void {
    const existingConstructor = classDecl.getConstructors()[0];
    if(existingConstructor){
        mergeStateIntoConstructor(existingConstructor,stateProps);
    }else{
        createConstructorwithState(classDecl,formatStateObject(stateProps));
    }
}

function createConstructorwithState(classDecl: ClassDeclaration,stateText : string) : void{
    classDecl.insertConstructor(0,{
        parameters : [{name : "props",type : "any"}],
        statements : [
            "super(props);",
            `this.state = ${stateText};`
        ]
    });
}

function mergeStateIntoConstructor(constructor : any,newStateProps : Record<string,string>) : void{
    const body = constructor.getBody() as Block;
    if(!body) return ;
    const statements = body.getStatements();
    let stateAssignmentIndex = -1;
    let stateAssignment = null;

    // Find existing this.state assignment
    for(let i=0;i<statements.length;i++){
        const statement = statements[i];
        const text = statement.getText();
        if(text.includes("this.state") && text.includes("=")){
            stateAssignmentIndex = i;
            stateAssignment = statement;
            break;
        }
    }

    if(stateAssignment){
        // Parse and merge existing state
        const existingText = stateAssignment.getText();
        const stateMatch = existingText.match(/this\.state\s*=\s*(\{[\s\S]*?\});?/);

        if(stateMatch){
            const existingStateStr = stateMatch[1];
            // Extract existing properties
            const existingProps = parseStateObject(existingStateStr);
            // Merge with new props (new props don't override existing)
            const mergedProps = { ...newStateProps, ...existingProps};
            const mergedState = formatStateObject(mergedProps);
            stateAssignment.replaceWithText(`this.state = ${mergedState};`);
        }
    }else{
        // Add state after super(props)
        const stateString = formatStateObject(newStateProps);
        // Find super() call
        let superIndex = 0;
        for(let i=0;i<statements.length;i++){
            if(statements[i].getText().includes("super")){
                superIndex = i;
                break;
            }
        }
        body.insertStatements(superIndex,`this.state = ${stateString};`);
    }
}

function parseStateObject(stateStr  : string) : Record<string,string>{
    const props : Record<string,string> = {};
    // Remove outer braces
    const inner = stateStr.replace(/^\{|\}$/g, '').trim();
    // splt by comma
    const parts = splitStateProps(inner);
    parts.forEach(part => {
        const colonIndex = part.indexOf(':');
        if (colonIndex !== -1) {
            const key = part.substring(0, colonIndex).trim();
            const value = part.substring(colonIndex + 1).trim().replace(/;$/, '');
            if (key && value) {
                props[key] = value;
            }
        }
        });
        return props;
}

function generateFixes(issues : Issue[]) : Fix[] {
    const fixes : Fix[] = [];
    const project = new Project();

    //grouping issues by files
    const issuesByFile = issues.reduce((acc,issue) => {
        if(!acc[issue.file]) acc[issue.file] = [];
        acc[issue.file].push(issue);
        return acc;
    },{} as Record<string,Issue[]>);

    Object.entries(issuesByFile).forEach(([fileURLToPath,FileIssues]) => {
        const sourceFile = project.addSourceFileAtPath(fileURLToPath);

        FileIssues.forEach(issue => {
            const classes = sourceFile.getClasses();

            for(const classDecl of classes){
                const method = classDecl.getMethods().find(m => 
                    m.getName() === issue.api && m.getStartLineNumber() === issue.line );

                    if(method){
                        const pattern = classifyLifeCycleMethod(issue.api,method);
                        const fix = createFix(fileURLToPath,issue,method,pattern);
                        if(fix){
                            fixes.push(fix);
                        }
                        break;
                    }
            }
        });
    });
    return fixes;
}

function createFix(fileURLToPath : string,issue : Issue,method : MethodDeclaration,pattern : Pattern) : Fix | null {
    const methodName = method.getName();
    switch(pattern) {
        case "empty" : 
            return {
                file: fileURLToPath,
                line: issue.line,
                api: methodName,
                before: method.getText(),
                after: `// Removed empty ${methodName}`,
                type: "remove",
                confidence: "high"
            };
            case "async" : 
                return {
                    file: fileURLToPath,
                    line: issue.line,
                    api: methodName,
                    before: method.getText(),
                    after: method.getText().replace(methodName,'componentDidMount'),
                    type: "rename",
                    confidence: "high"
                };
            case "setState-only" : 
                const stateProps = extractSetStateCalls(method);
                if(stateProps){
                    const stateString = formatStateObject(stateProps);
                
            return {
                file: fileURLToPath,
                line: issue.line,
                api: methodName,
                before: method.getText(),
                after: `constructor(props) {\n  super(props);\n  this.state = ${stateString};\n}`,
                type: "move-to-constructor",
                confidence: "high"
            };
        }
        break;

        case "simple-logging" : 
        case "simple-side-effect" :
            const newMethodName = methodName.includes("ReceiveProps") || methodName.includes("Update") ? "componentDidUpdate" : "componentDidMount";
            let newCode = method.getText().replace(methodName,newMethodName);
            //Update parameter names for componentDidUpdate
            if(newMethodName === 'componentDidUpdate'){
                newCode = newCode.replace("nextProps", "prevProps").replace("nextState", "prevState");
            }
            return {
                file: fileURLToPath,
                line: issue.line,
                api: methodName,
                before: method.getText(),
                after: newCode,
                type: "rename",
                confidence: "high"
            };

            case "unsafe-prefix" : 
            return {
                file: fileURLToPath,
                line: issue.line,
                api: methodName,
                before: method.getText(),
                after: `// URGENT: Remove ${methodName} - will be removed in future React versions\n${method.getText()}`,
                type: "manual-review",
                confidence: "low",
                urgency : "high"
            };
            case "complex" : 
                return {
                    file: fileURLToPath,
                    line: issue.line,
                    api: methodName,
                    before: method.getText(),
                    after: `// MANUAL REVIEW: Complex ${methodName} requires careful migration\n// See: https://react.dev/reference/react/Component#componentwillreceiveprops`,
                    type: "manual-review",
                    confidence: "low"
                };        
    }
    return null;
}

function findMethodAtLine(sourceFile : any, line : number) : MethodDeclaration | null {
    let foundMethod : MethodDeclaration | null = null;
    sourceFile.getClasses().forEach((classDecl : any) => {
        classDecl.getMethods().forEach((method : MethodDeclaration) => {
            if(method.getStartLineNumber() === line){
                foundMethod = method
            }
        })
    })
    return foundMethod;
}

function applyFixes(fixes : Fix[]) : void {
    const project = new Project;
    const fixesByFiles = fixes.reduce((acc,fix) => {
        if(!acc[fix.file]) acc[fix.file] = [];
        acc[fix.file].push(fix);
        return acc;
    },{} as Record<string,Fix[]>);

    const safeFixes = fixes.filter(f => f.confidence === "high");
    
    console.log(`\n🔧 Applying ${safeFixes.length} high-confidence fix(es)...\n`);

    const results = {
        success : [] as string[],
        failed : [] as {file : string,error : string}[]
    }
    Object.entries(fixesByFiles).forEach(([fileURLToPath,fileFixes]) => {
        try{
            const sourceFile = project.addSourceFileAtPath(fileURLToPath);
            const classes = sourceFile.getClasses();
            fileFixes.forEach(fix => {
                if(fix.confidence !== "high") return;

                classes.forEach(classDecl => {
                    const method = classDecl.getMethods().find(m => m.getStartLineNumber() === fix.line);
                    if(method){
                        const fileName = fix.file.split('/').pop();
                        console.log(`Applying fix to ${fileName}:${fix.line} - ${fix.type}`);
                        // Apply the fix
                        if (fix.type === "remove") {
                            method.remove();
                        } 
                        else if (fix.type === "rename") {
                            const oldName = method.getName();
                            const newName = oldName.includes('ReceiveProps') || oldName.includes('Update') 
                            ? 'componentDidUpdate' 
                            : 'componentDidMount';
                            
                            method.rename(newName);

                            if(newName === "componentDidUpdate"){
                                const params = method.getParameters();
                                if(params[0]?.getName() === 'nextProps'){
                                    params[0].rename('prevProps');
                                }
                                if(params[1]?.getName() === 'nextState'){
                                    params[1].rename('prevState');
                                }
                            }
                        }
                        else if (fix.type === "move-to-constructor") {
                            const stateProps = extractSetStateCalls(method);
                            if (stateProps) {
                                findOrCreateConstructor(classDecl, stateProps);
                                method.remove();
                            }
                        }
                    }
                });
            });
            results.success.push(fileURLToPath);
        }
        catch (error: any) {
            results.failed.push({
                file: fileURLToPath,
                error: error.message
                });
                console.log(`  ❌ ${fileURLToPath.split('/').pop()} - FAILED: ${error.message}`);
            }
            });
                  // Save only successful files
            try {
                project.saveSync();
                console.log(`\n✅ Applied ${results.success.length} file(s) successfully`);
            } catch (error: any) {
                        console.log(`\n❌ Error saving files: ${error.message}`);
            }
                    
            if (results.failed.length > 0) {
                console.log(`⚠️  ${results.failed.length} file(s) failed`);
            }
                    
            const manualFixes = fixes.filter(f => f.confidence !== "high");
                if (manualFixes.length > 0) {
                    console.log(`⚠️  ${manualFixes.length} fix(es) need manual review\n`);
                }
            }

export { applyFixes, Fix, generateFixes };
