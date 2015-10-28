﻿import utilsModule = require("utils/utils");
import textModule = require("text");

// TODO: Implement all the APIs receiving callback using async blocks
// TODO: Check whether we need try/catch blocks for the iOS implementation

export class FileSystemAccess {
    //private keyFileType = "NSFileType";
    //private keyReadonly = "NSFileImmutable";
    //private NSUTF8StringEncoding = 4;
    private keyModificationTime = "NSFileModificationDate";
    private documentDir = 9;
    private cachesDir = 13;
    private userDomain = 1;

    public getLastModified(path: string): Date {
        var fileManager = NSFileManager.defaultManager();
        var attributes = fileManager.attributesOfItemAtPathError(path);

        if (attributes) {
            return attributes.objectForKey(this.keyModificationTime);
        } else {
            return new Date();
        }
    }

    public getParent(path: string, onError?: (error: any) => any): { path: string; name: string } {
        try {
            var fileManager = NSFileManager.defaultManager();
            var nsString = NSString.alloc().initWithString(path);

            var parentPath = nsString.stringByDeletingLastPathComponent;
            var name = fileManager.displayNameAtPath(parentPath);

            return {
                path: parentPath.toString(),
                name: name
            };
        }
        catch (exception) {
            if (onError) {
                onError(exception);
            }

            return undefined;
        }
    }

    public getFile(path: string, onError?: (error: any) => any): { path: string; name: string; extension: string } {
        try {
            var fileManager = NSFileManager.defaultManager();
            var exists = fileManager.fileExistsAtPath(path);

            if (!exists) {
                if (!fileManager.createFileAtPathContentsAttributes(path, null, null)) {
                    if (onError) {
                        onError(new Error("Failed to create folder at path '" + path + "'"));
                    }

                    return undefined;
                }
            }

            var fileName = fileManager.displayNameAtPath(path);

            return {
                path: path,
                name: fileName,
                extension: this.getFileExtension(path)
            };
        }
        catch (exception) {
            if (onError) {
                onError(exception);
            }

            return undefined;
        }
    }

    public getFolder(path: string, onError?: (error: any) => any): { path: string; name: string } {
        try {
            var fileManager = NSFileManager.defaultManager();
            var exists = this.folderExists(path);

            if (!exists) {
                try {
                    fileManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(path, true, null)
                }
                catch (ex) {
                    if (onError) {
                        onError(new Error("Failed to create folder at path '" + path + "': " + ex));
                    }

                    return undefined;
                }
            }

            var dirName = fileManager.displayNameAtPath(path);

            return {
                path: path,
                name: dirName
            };
        }
        catch (ex) {
            if (onError) {
                onError(new Error("Failed to create folder at path '" + path + "'"));
            }

            return undefined;
        }
    }

    public eachEntity(path: string, onEntity: (file: { path: string; name: string; extension: string }) => any, onError?: (error: any) => any) {
        if (!onEntity) {
            return;
        }

        this.enumEntities(path, onEntity, onError);
    }

    public getEntities(path: string, onError?: (error: any) => any): Array<{ path: string; name: string; extension: string }> {
        var fileInfos = new Array<{ path: string; name: string; extension: string }>();

        var onEntity = function (entity: { path: string; name: string; extension: string }): boolean {
            fileInfos.push(entity);
            return true;
        }

        var errorOccurred;
        var localError = function (error: any) {
            if (onError) {
                onError(error);
            }

            errorOccurred = true;
        }

        this.enumEntities(path, onEntity, localError);

        if (!errorOccurred) {
            return fileInfos;
        }

        return null;
    }

    public fileExists(path: string): boolean {
        var fileManager = NSFileManager.defaultManager();
        return fileManager.fileExistsAtPath(path);
    }

    public folderExists(path: string): boolean {
        var fileManager = NSFileManager.defaultManager();

        var outVal = new interop.Reference();
        var exists = fileManager.fileExistsAtPathIsDirectory(path, outVal);

        return exists && outVal.value > 0;
    }

    public concatPath(left: string, right: string): string {
        // TODO: This probably is not efficient, we may try concatenation with the "/" character
        var nsArray = utilsModule.ios.collections.jsArrayToNSArray([left, right]);
        var nsString = NSString.pathWithComponents(nsArray);

        return nsString.toString();
    }

    public deleteFile(path: string, onError?: (error: any) => any) {
        this.deleteEntity(path, onError);
    }

    public deleteFolder(path: string, onError?: (error: any) => any) {
        this.deleteEntity(path, onError);
    }

    public emptyFolder(path: string, onError?: (error: any) => any) {
        var fileManager = NSFileManager.defaultManager();
        var entities = this.getEntities(path, onError);

        if (!entities) {
            return;
        }

        var i;
        for (i = 0; i < entities.length; i++) {
            try {
                fileManager.removeItemAtPathError(entities[i].path);
            }
            catch (ex) {
                if (onError) {
                    onError(new Error("Failed to empty folder '" + path + "': " + ex));
                }

                return;
            }
        }
    }

    public rename(path: string, newPath: string, onError?: (error: any) => any) {
        var fileManager = NSFileManager.defaultManager();

        try {
            fileManager.moveItemAtPathToPathError(path, newPath);
        }
        catch (ex) {
            if (onError) {
                onError(new Error("Failed to rename '" + path + "' to '" + newPath + "': " + ex));
            }
        }
    }

    public getDocumentsFolderPath(): string {
        return this.getKnownPath(this.documentDir);
    }

    public getTempFolderPath(): string {
        return this.getKnownPath(this.cachesDir);
    }

    public readText(path: string, onError?: (error: any) => any, encoding?: any) {
        var actualEncoding = encoding;
        if (!actualEncoding) {
            actualEncoding = textModule.encoding.UTF_8;
        }

        try {
            var nsString = NSString.stringWithContentsOfFileEncodingError(path, actualEncoding);
            return nsString.toString();
        }
        catch (ex) {
            if (onError) {
                onError(new Error("Failed to read file at path '" + path + "': " + ex));
            }
        }
    }

    public writeText(path: string, content: string, onError?: (error: any) => any, encoding?: any) {
        var nsString = NSString.alloc().initWithString(content);

        var actualEncoding = encoding;
        if (!actualEncoding) {
            actualEncoding = textModule.encoding.UTF_8;
        }

        // TODO: verify the useAuxiliaryFile parameter should be false
        try {
            nsString.writeToFileAtomicallyEncodingError(path, false, actualEncoding);
        }
        catch (ex) {
            if (onError) {
                onError(new Error("Failed to write to file '" + path + "': " + ex));
            }
        }
    }

    private getKnownPath(folderType: number): string {
        var fileManager = NSFileManager.defaultManager();
        var paths = fileManager.URLsForDirectoryInDomains(folderType, this.userDomain);

        var url = paths.objectAtIndex(0);
        return url.path;
    }

    // TODO: This method is the same as in the iOS implementation.
    // Make it in a separate file / module so it can be reused from both implementations.
    private getFileExtension(path: string): string {
        // TODO [For Panata]: The definitions currently specify "any" as a return value of this method
        //var nsString = Foundation.NSString.stringWithString(path);
        //var extension = nsString.pathExtension();

        //if (extension && extension.length > 0) {
        //    extension = extension.concat(".", extension);
        //}

        //return extension;
        var dotIndex = path.lastIndexOf(".");
        if (dotIndex && dotIndex >= 0 && dotIndex < path.length) {
            return path.substring(dotIndex);
        }

        return "";
    }

    private deleteEntity(path: string, onError?: (error: any) => any) {
        var fileManager = NSFileManager.defaultManager();
        try {
            fileManager.removeItemAtPathError(path);
        }
        catch (ex) {
            if (onError) {
                onError(new Error("Failed to delete file at path '" + path + "': " + ex));
            }
        }
    }

    private enumEntities(path: string, callback: (entity: { path: string; name: string; extension: string }) => boolean, onError?: (error) => any) {
        try {
            var fileManager = NSFileManager.defaultManager();
            try {
                var files = fileManager.contentsOfDirectoryAtPathError(path);
            }
            catch (ex) {
                if (onError) {
                    onError(new Error("Failed to enum files for folder '" + path + "': " + ex));
                }

                return;
            }

            var file;
            var i;
            var info;
            var retVal;

            for (i = 0; i < files.count; i++) {
                file = files.objectAtIndex(i);

                info = {
                    path: this.concatPath(path, file),
                    name: file
                };

                if (!this.folderExists(this.joinPath(path, file))) {
                    info.extension = this.getFileExtension(info.path);
                }

                retVal = callback(info);
                if (retVal === false) {
                    // the callback returned false meaning we should stop the iteration
                    break;
                }
            }
        }
        catch (ex) {
            if (onError) {
                onError(ex);
            }
        }
    }

    public getPathSeparator(): string {
        return "/";
    }

    public normalizePath(path: string): string {
        var nsString: NSString = NSString.stringWithString(path);
        var normalized = nsString.stringByStandardizingPath;

        return normalized;
    }

    public joinPath(left: string, right: string): string {
        var nsString: NSString = NSString.stringWithString(left);
        return nsString.stringByAppendingPathComponent(right);
    }

    public joinPaths(paths: string[]): string {
        if (!paths || paths.length === 0) {
            return "";
        }

        var nsArray = NSMutableArray.alloc().initWithCapacity(paths.length);

        var i;
        for (i = 0; i < paths.length; i++) {
            nsArray.addObject(paths[i]);
        }

        var nsString = NSString.stringWithString(NSString.pathWithComponents(nsArray));
        return nsString.stringByStandardizingPath;
    }
}