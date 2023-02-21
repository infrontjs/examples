module.exports = {
    ifversion : "0.9.31",
    examples : [
        {
            directory : '01-most-minimal',
            title : 'Most Minimal',
            desc : 'The very first example shows the most minimal InfrontJS application. It\'s a shameless plug ;-)',
            source : ' // Most minimal InfrontJS app showing the default scene (aka shameless plug)\n' +
                '  const myApp = new IF.App();\n' +
                '  myApp.run();'
        },
        {
            directory : '02-todo-app',
            title : 'ToDo App',
            desc : 'Every modern framework seems to have a "ToDo" app example. Seems to be the new type of "Hello World".',
            source : '  // Create Main State which includes all the application logic\n' +
                '  class MainState extends IF.State\n' +
                '  {\n' +
                '    // Declare this as default state\n' +
                '    static ROUTE = \'/\';\n' +
                '\n' +
                '    // The template as native as possible to standard HTML\n' +
                '    static TMPL = `\n' +
                '            <input type="text" id="new-todo" />\n' +
                '            <button type="button" id="btn-add">Add</button>\n' +
                '            <ul>\n' +
                '                <% for ( i = 0; i < todos.length; i++ ) {   %>\n' +
                '                    <li><%= todos[ i ] %></li>\n' +
                '                <% }    %>\n' +
                '            </ul>\n' +
                '        `;\n' +
                '\n' +
                '    enter()\n' +
                '    {\n' +
                '      // Our todo list as an simple array of strings\n' +
                '      this.todos = [];\n' +
                '\n' +
                '      // Add action, no automatic data-binding hence no magic or black box\n' +
                '      this.app.container.addEventListener( \'click\', (e) => {\n' +
                '        if ( !e.target.matches( \'#btn-add\' ) ) return;\n' +
                '        this.todos.push( this.app.container.querySelector( \'#new-todo\' ).value );\n' +
                '        this.app.container.querySelector( \'#new-todo\' ).value = "";\n' +
                '        this.render();\n' +
                '      });\n' +
                '\n' +
                '      // Initial rendering\n' +
                '      this.render();\n' +
                '    }\n' +
                '\n' +
                '    render()\n' +
                '    {\n' +
                '      // Optimized rendering using DOM diffing\n' +
                '      this.app.templateManager.render( this.app.container, MainState.TMPL, { todos : this.todos } );\n' +
                '    }\n' +
                '  }\n' +
                '\n' +
                '  // Creating the InfrontJS application and adding the MainState\n' +
                '  const myApp = new IF.App( document.getElementById( \'app\' ) );\n' +
                '  myApp.stateManager.add( MainState );\n' +
                '  myApp.run();'
        }
    ]
};
