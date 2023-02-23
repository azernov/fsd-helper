#! /usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const yargs = require("yargs");

const glob = require("glob");

const config = require('./config')

const options = yargs
    .usage("Usage: npx fsd-helper -c <name>")
    .option("c", {
        alias: "component",
        describe: "Vue component name. Example: widgets/MyComponent",
        type: "string",
        demandOption: true
    })
    .argv;


var componentName = options.component;

function copyAndRename(sourcePath, targetPath, replacements) {
    glob(path.join(sourcePath, "**/*"), (error, files) => {
        if (error) return;
        files.forEach((sourceFilePath) => {
            let targetFilePath = sourceFilePath
            for (let from in replacements) {
                //Делаем все замены в названии файла
                targetFilePath = targetFilePath.replaceAll(from, replacements[from]).replace(sourcePath, '')
            }
            targetFilePath = path.join(targetPath, targetFilePath)
            let fileInfo = fs.lstatSync(sourceFilePath);
            if(fileInfo.isDirectory()){
                //создаем переименованный каталог, если его нет
                if(!fs.existsSync(targetFilePath)){
                    console.log('Creating folder: ' + targetFilePath);
                    fs.mkdirSync(targetFilePath, {
                        recursive: true
                    });
                }
            }
            else if(fileInfo.isFile()){
                if(fs.existsSync(targetFilePath)){
                    console.log('File already exists: ' + targetFilePath)
                    return;
                }
                //копируем переименованный файл, если его нет
                console.log('Creating file: ' + targetFilePath);
                fs.copyFileSync(sourceFilePath, targetFilePath)
                let ws = fs.createWriteStream(targetFilePath);
                let content = fs.readFileSync(targetFilePath).toString();
                for (let from in replacements) {
                    //Делаем все замены в содержимом файла
                    content = content.replaceAll(from, replacements[from]);
                }
                //вписать содержимое
                ws.write(content);
                ws.close();
            }
        })
    })
}


function makeComponentFolderStructure(componentFolderName) {
    //1. Получаем название компонента
    let pieces = componentFolderName.split('/')
    let componentName = pieces.pop()

    //2. Создаем недостающие каталоги
    let folderPath = path.resolve(path.join(process.cwd(), config.dir.source.base, ...pieces))
    if (!fs.existsSync(folderPath)) {
        console.log('Creating folder: ' + folderPath);
        fs.mkdirSync(folderPath, {
            recursive: true
        });
    }

    copyAndRename(path.resolve(path.join(process.cwd(), config.dir.source.templates)), folderPath,{
        '$name$':componentName
    });
}


makeComponentFolderStructure(componentName);
