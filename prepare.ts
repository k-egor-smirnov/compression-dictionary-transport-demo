import { execSync } from "child_process";

console.log('Preparing static assets');

execSync('zstd --train static/js/* -B1024 -o ./static/dict.dat');
