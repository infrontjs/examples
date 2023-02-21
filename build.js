const fs = require( "fs" );
const fse = require('fs-extra');

const ejs = require( 'ejs' );


// Example Data
const cfg = require( './build.config.js' );
const { examples } = require( "./build.config" );


const mainTmplString = fs.readFileSync( './www/index.tmpl.html', 'utf-8' );
const mainTemplate = ejs.compile( mainTmplString );

const exampleTmplString = fs.readFileSync( './www/example.tmpl.html', 'utf-8' );
const exampleTemplate = ejs.compile( exampleTmplString );

try
{
    fs.statSync( './dist' );
    fs.rmSync( './dist', { recursive: true } );
}
catch( e )
{
    // Fail silently...
}


fs.mkdirSync( './dist' );

fse.copySync( 'www', './dist' );
fse.copySync( 'examples', './dist' );

// Generate static html files by data
fs.writeFileSync(  './dist/index.html', mainTemplate( { examples : cfg.examples } ) );
for ( let ei = 0; ei < examples.length; ei++ )
{
    fs.writeFileSync( './dist/' + examples[ ei ].directory + '/index.html', exampleTemplate( { e : examples[ ei ] } ) );
}

// Cleanup
fs.rmSync( './dist/index.tmpl.html' );
fs.rmSync( './dist/example.tmpl.html' );
