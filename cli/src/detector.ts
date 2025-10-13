import deprecatedApi = require("./deprecated-apis.json");
import fs from "fs";
import { Project, SourceFile, SyntaxKind, JsxAttribute,JsxSelfClosingElement,JsxOpeningElement} from "ts-morph";

interface DeprecatedAPI {
    name : string,
    deprecatedIn : string,
    removedIn ?: string,
    alternative : string,
    severity : "warning" | "error";
}

interface Issue{
    api : string;
    line : number;
    column?: number;
    file : string;
    message : string;
    deprecatedIn?: string;
    removedIn?: string;
    alternative?: string;
    severity?:string;
    category: string;

}
interface DeprecatedAPIConfig{
    react : {
        lifecycleMethods : string[],
        refs : string[],
        context : string[],
        domMethods : string[],
        rendering : string[],
        factory : string[],
        patterns : string[],
        others : string[];
    }
}


function detectLifeCycleMethods(sourceFile : SourceFile) : Issue[] {
    const issues : Issue[] = [];
    const lifeCycleMethods  = deprecatedApi.react.lifecycleMethods;
    sourceFile.getClasses().forEach(classDecl => {
        classDecl.getMethods().forEach(member => {
            const methodName = member.getName();
            const deprecatedInfo = lifeCycleMethods.find(api => api.name === methodName);
                        if(deprecatedInfo){
                            issues.push({
                                    api : methodName,
                                    line : member.getStartLineNumber(),
                                    column: member.getStartLinePos(),
                                    file : sourceFile.getFilePath(),
                                    message : `Deprecated LifeCycle Api ${methodName}`,
                                    deprecatedIn : deprecatedInfo.deprecatedInVersion,
                                    //removedIn : deprecatedInfo.removedInVersion || undefined,
                                    alternative : deprecatedInfo.alternative,
                                    severity : deprecatedInfo.severity,
                                    category : "lifecycleMethods"
                            });
                        }
        });
    });
    return issues;
}

function detectStringRefs(sourceFile : SourceFile) : Issue[] {
    const issues: Issue[] = [];
    const refInfo = deprecatedApi.react.refs[0];

    const jsxElements = [
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    ];
    

    jsxElements.forEach(el => {
        const refAttr = el.getAttribute("ref");
        if(refAttr?.isKind(SyntaxKind.JsxAttribute)){
            const initializer = refAttr.getInitializer();
            if(initializer && initializer.isKind(SyntaxKind.StringLiteral)){
                issues.push({
                    api: 'String ref',
                    file: sourceFile.getFilePath(),
                    line: refAttr.getStartLineNumber(),
                    column: refAttr.getStartLinePos(),
                    message: `Deprecated: String ref "${initializer.getLiteralText()}"`,
                    severity: refInfo.severity,
                    deprecatedIn: refInfo.deprecatedInVersion,
                    //removedIn: refInfo.removedInVersion ,
                    alternative: refInfo.alternative,
                    category: "refs"
                });
            }
        }
    });
    
    // Find this.refs usage
    sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .forEach(propAccess => {
        const expression = propAccess.getExpression();
        const name = propAccess.getName();
        
        if (expression.getText() === 'this' && name === 'refs') {
        issues.push({
            api: 'this.refs',
            file: sourceFile.getFilePath(),
            line: propAccess.getStartLineNumber(),
            column: propAccess.getStartLinePos(),
            message: 'Deprecated: this.refs access',
            severity: refInfo.severity,
            deprecatedIn: refInfo.deprecatedInVersion,
            //removedIn: refInfo.removedInVersion,
            alternative: refInfo.alternative,
            category: "refs"
        });
        }
    });

    return issues;
}

function detectLegacyContext(sourceFile: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const contextInfo = deprecatedApi.react.context[0];
  
    sourceFile.getClasses().forEach(classDecl => {
      // Check for getChildContext method
        const getChildContext = classDecl.getMethod('getChildContext');
        if (getChildContext) {
            issues.push({
            api: 'getChildContext',
            file: sourceFile.getFilePath(),
            line: getChildContext.getStartLineNumber(),
            column: getChildContext.getStartLinePos(),
            message: 'Deprecated: Legacy Context API (getChildContext)',
            severity: contextInfo.severity as "warning" | "error",
            deprecatedIn: contextInfo.deprecatedInVersion,
            //removedIn: contextInfo.removedInVersion,
            alternative: contextInfo.alternative,
            category: "context"
            });
        }
    
        // Check for static childContextTypes
        const childContextTypes = classDecl.getStaticProperty('childContextTypes');
        if (childContextTypes) {
            issues.push({
            api: 'childContextTypes',
            file: sourceFile.getFilePath(),
            line: childContextTypes.getStartLineNumber(),
            column: childContextTypes.getStartLinePos(),
            message: 'Deprecated: Legacy Context API (childContextTypes)',
            severity: contextInfo.severity as "warning" | "error",
            deprecatedIn: contextInfo.deprecatedInVersion,
            //removedIn: contextInfo.removedInVersion,
            alternative: contextInfo.alternative,
            category: "context"
            });
        }
    
        // Check for static contextTypes
        const contextTypes = classDecl.getStaticProperty('contextTypes');
        if (contextTypes) {
            issues.push({
            api: 'contextTypes',
            file: sourceFile.getFilePath(),
            line: contextTypes.getStartLineNumber(),
            column: contextTypes.getStartLinePos(),
            message: 'Deprecated: Legacy Context API (contextTypes)',
            severity: contextInfo.severity as "warning" | "error",
            deprecatedIn: contextInfo.deprecatedInVersion,
            //removedIn: contextInfo.removedInVersion,
            alternative: contextInfo.alternative,
            category: "context"
            });
        }
        });
    
        return issues;
}

function detectFindDOMNode(sourceFile: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const domInfo = deprecatedApi.react.domMethods[0]
        // Find all call expressions
        sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
        const expr = call.getExpression();
        const text = expr.getText();
    
        if (text.includes('findDOMNode')) {
            issues.push({
            api: 'findDOMNode',
            file: sourceFile.getFilePath(),
            line: call.getStartLineNumber(),
            column: call.getStartLinePos(),
            message: 'Deprecated: ReactDOM.findDOMNode()',
            severity: domInfo.severity as "warning" | "error",
            deprecatedIn: domInfo.deprecatedInVersion,
            alternative: domInfo.alternative,
            category: "domMethods"
            });
        }
        });
    
    return issues;
}

function detectReactDOMRender(sourceFile: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const renderMethods = deprecatedApi.react.rendering;
  
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
        const expr = call.getExpression();
        const text = expr.getText();
    
        renderMethods.forEach(method => {
            const methodName = method.name.split('.')[1]; // Get 'render' from 'ReactDOM.render'
            
            if (text.includes(`ReactDOM.${methodName}`)) {
            issues.push({
                api: method.name,
                file: sourceFile.getFilePath(),
                line: call.getStartLineNumber(),
                column: call.getStartLinePos(),
                message: `Deprecated: ${method.name}`,
                severity: method.severity as "warning" | "error",
                deprecatedIn: method.deprecatedInVersion,
                alternative: method.alternative,
                category: "rendering"
            });
            }
        });
    });
    return issues;
}
function detectCreateFactory(sourceFile: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const factoryMethods = deprecatedApi.react["factory / legacyComponentCreation"];

        sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
        const expr = call.getExpression();
        const text = expr.getText();
    
        if (text.includes('createFactory')) {
            const factoryInfo = factoryMethods.find(m => m.name === 'createFactory');
            if (factoryInfo) {
            issues.push({
                api: 'React.createFactory',
                file: sourceFile.getFilePath(),
                line: call.getStartLineNumber(),
                column: call.getStartLinePos(),
                message: 'Deprecated: React.createFactory()',
                severity: factoryInfo.severity as "warning" | "error",
                deprecatedIn: factoryInfo.deprecatedInVersion,
                alternative: factoryInfo.alternative,
                category: "factory"
            });
            }
        }
        });
    return issues;
}
function detectDefaultPropsOnFunctions(sourceFile: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const defaultPropsInfo = deprecatedApi.react.patterns[0];
    
        // Find function declarations and arrow functions
        const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
        .concat(sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction) as any);
    
        sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression).forEach(binary => {
        const left = binary.getLeft().getText();
        const operator = binary.getOperatorToken().getText();
    
        // Match pattern: ComponentName.defaultProps = { ... }
        if (operator === '=' && left.includes('.defaultProps')) {
            const componentName = left.split('.')[0];
            
            // Check if it's a function component (not a class)
            const isClass = sourceFile.getClasses().some(c => c.getName() === componentName);
            
            if (!isClass) {
            issues.push({
                api: 'defaultProps on function component',
                file: sourceFile.getFilePath(),
                line: binary.getStartLineNumber(),
                column: binary.getStartLinePos(),
                message: `Deprecated: ${componentName}.defaultProps on function component`,
                severity: defaultPropsInfo.severity as "warning" | "error",
                deprecatedIn: defaultPropsInfo.deprecatedInVersion,
                alternative: defaultPropsInfo.alternative,
                category: "patterns"
            });
            }
        }
        });
    
        return issues;
}

function detectTestUtils(sourceFile: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const testUtils = deprecatedApi.react.others;
    
        // Check imports
        sourceFile.getImportDeclarations().forEach(importDecl => {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
        testUtils.forEach(util => {
            if (moduleSpecifier.includes(util.pattern.split("'")[1])) {
            issues.push({
                api: util.name,
                file: sourceFile.getFilePath(),
                line: importDecl.getStartLineNumber(),
                column: importDecl.getStartLinePos(),
                message: `Deprecated import: ${util.name}`,
                severity: util.severity as "warning" | "error",
                deprecatedIn: util.deprecatedInVersion,
                alternative: util.alternative,
                category: "testing"
            });
            }
        });
        });
    
        return issues;
}


export function detectDeprecated(pattern: string): Issue[] {
    const issues: Issue[] = [];
    
    // Expand ~ to home directory
    const expandedPattern = pattern.replace(/^~/, require('os').homedir());
    
    console.log(`🔍 Original pattern: ${pattern}`);
    console.log(`📂 Expanded pattern: ${expandedPattern}\n`);
    
    const project = new Project();
    
    try {
        console.log(`🔄 Loading files...`);
        const sourceFiles = project.addSourceFilesAtPaths(expandedPattern);
        
        console.log(`📁 Scanning ${sourceFiles.length} file(s)...\n`);
        
        if (sourceFiles.length === 0) {
            console.log(`\n⚠️  No files found!`);
            console.log(`\n💡 Try using absolute paths or check if the directory exists\n`);
            return issues;
        }
        
        sourceFiles.forEach(sourceFile => {
            console.log(`  Checking: ${sourceFile.getFilePath()}`);
            
            // Run all detection functions
            issues.push(...detectLifeCycleMethods(sourceFile));
            issues.push(...detectStringRefs(sourceFile));
            issues.push(...detectLegacyContext(sourceFile));
            issues.push(...detectFindDOMNode(sourceFile));
            issues.push(...detectReactDOMRender(sourceFile));
            issues.push(...detectCreateFactory(sourceFile));
            issues.push(...detectDefaultPropsOnFunctions(sourceFile));
            issues.push(...detectTestUtils(sourceFile));
        });
        
        console.log(`\n✅ Scan complete!`);
        
        } catch (error: any) {
        console.error(`❌ Error during detection: ${error.message}`);
        }
        
        return issues;
}
    
    export { Issue };
