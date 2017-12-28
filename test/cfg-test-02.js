/** ******************************************************************************************************************
 * @file Describe what cfg-test-01 does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 27-Dec-2017
 *********************************************************************************************************************/
"use strict";

pp$1.parseClass = function( node, isStatement ) {
    var this$1 = this;

    this.next();

    this.parseClassId( node, isStatement );
    this.parseClassSuper( node );
    var classBody      = this.startNode();
    var hadConstructor = false;
    classBody.body     = [];
    this.expect( types.braceL );
    while ( !this.eat( types.braceR ) )
    {
        if ( this$1.eat( types.semi ) )
        { continue }
        var method        = this$1.startNode();
        var isGenerator   = this$1.eat( types.star );
        var isAsync       = false;
        var isMaybeStatic = this$1.type === types.name && this$1.value === "static";
        this$1.parsePropertyName( method );
        method.static = isMaybeStatic && this$1.type !== types.parenL;
        if ( method.static )
        {
            if ( isGenerator )
            { this$1.unexpected(); }
            isGenerator = this$1.eat( types.star );
            this$1.parsePropertyName( method );
        }
        if ( this$1.options.ecmaVersion >= 8 && !isGenerator && !method.computed &&
             method.key.type === "Identifier" && method.key.name === "async" && this$1.type !== types.parenL &&
             !this$1.canInsertSemicolon() )
        {
            isAsync = true;
            this$1.parsePropertyName( method );
        }
        method.kind  = "method";
        var isGetSet = false;
        if ( !method.computed )
        {
            var key = method.key;
            if ( !isGenerator && !isAsync && key.type === "Identifier" && this$1.type !== types.parenL && ( key.name === "get" || key.name === "set" ) )
            {
                isGetSet    = true;
                method.kind = key.name;
                key         = this$1.parsePropertyName( method );
            }
            if ( !method.static && ( key.type === "Identifier" && key.name === "constructor" ||
                                     key.type === "Literal" && key.value === "constructor" ) )
            {
                if ( hadConstructor )
                { this$1.raise( key.start, "Duplicate constructor in the same class" ); }
                if ( isGetSet )
                { this$1.raise( key.start, "Constructor can't have get/set modifier" ); }
                if ( isGenerator )
                { this$1.raise( key.start, "Constructor can't be a generator" ); }
                if ( isAsync )
                { this$1.raise( key.start, "Constructor can't be an async method" ); }
                method.kind    = "constructor";
                hadConstructor = true;
            }
        }
        this$1.parseClassMethod( classBody, method, isGenerator, isAsync );
        if ( isGetSet )
        {
            var paramCount = method.kind === "get" ? 0 : 1;
            if ( method.value.params.length !== paramCount )
            {
                var start = method.value.start;
                if ( method.kind === "get" )
                { this$1.raiseRecoverable( start, "getter should have no params" ); }
                else
                { this$1.raiseRecoverable( start, "setter should have exactly one param" ); }
            }
            else
            {
                if ( method.kind === "set" && method.value.params[ 0 ].type === "RestElement" )
                { this$1.raiseRecoverable( method.value.params[ 0 ].start, "Setter cannot use rest params" ); }
            }
        }
    }
    node.body = this.finishNode( classBody, "ClassBody" );
    return this.finishNode( node, isStatement ? "ClassDeclaration" : "ClassExpression" )
};
