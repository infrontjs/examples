const fs = require( "fs" );
const fse = require('fs-extra');

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
fse.copySync( 'examples', './dist/examples' );
