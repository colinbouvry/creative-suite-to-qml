﻿/*
Photoshop to APP Exporter

Version: 0.5

For information about Qt Quick itself:
http://qt.nokia.com/products/qt-quick/

Author: Jens Bache-wiig et Colin Bouvry
contact: jens.bache-wiig@nokia.com et colin.bouvry@gmail.com

Copyright (c) 2010, Nokia
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software
   must display the following acknowledgement:
   This product includes software developed by the <organization>.
4. Neither the name of the <organization> nor the
   names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#target photoshop

var mainDialog
var progressPanel
var runButton = 1
var cancelButton = 2
var qmlfile
var jsonfile
var layerCount = 0
var layerIndex = 0
var cancelExport = 0

// Setting keys
var appString = "APP Exporter - 1"
var outputNameKey = 0;
var destinationKey = 1;
var rasterizeKey = 2;
var exportByGroupKey = 3;
var exportHidden = 4;
var exportQML = 5;
var exportJSON = 6;


Array.prototype.indexOf = function(elt /*, from*/)
{
    var len = this.length;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
            ? Math.ceil(from)
            : Math.floor(from);
    if (from < 0)
        from += len;

    for (; from < len; from++)
    {
        if (from in this &&
                this[from] === elt)
            return from;
    }
    return -1;
};

main();

function hexValue(dec)
{
    var result;
    switch (dec) {
    case 10:
        result = "a";
        break;
    case 11:
        result = "b"
        break;
    case 12:
        result = "c";
        break;
    case 13:
        result = "d";
        break;
    case 14:
        result = "e"
    case 15:
        result = "f"
        break;
    default:
        result = dec
        break;
    }
    return result;
}

// Converts SolidColor to a QML color property
function qtColor(color) {
    var r = Math.floor(color.rgb.red)
    var g = Math.floor(color.rgb.green);
    var b = Math.floor(color.rgb.blue)
    var a = Math.floor(color.rgb.alpha * 255)
    var v1 = hexValue(Math.floor(r / 16));
    var v2 = hexValue(r % 16);
    var v3 = hexValue(Math.floor(g / 16));
    var v4 = hexValue(g % 16);
    var v5 = hexValue(Math.floor(b / 16));
    var v6 = hexValue(b % 16);
    if (a > 0) {
        var v7 = hexValue(Math.floor(a / 16));
        var v8 = hexValue(a % 16);
        return  "\"#" + v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8 + "\"";
    }
    return  "\"#" + v1 + v2 + v3 + v4 + v5 + v6 + "\"";
}

function main() {

    var exportInfo = new Object();

    if (cancelButton == setupDialog(exportInfo)) 
        return 'cancel';


    var myMaximumValue = 1.0;
    var myProgressBarWidth = 300;
    progressPanel = new Window('window', 'Exporting document to APP...');
    progressPanel.myProgressBar = progressPanel.add('progressbar', [12, 12, myProgressBarWidth, 24], 0, myMaximumValue);
    progressPanel.buttonCancel = progressPanel .add("button", undefined, "Cancel");

    progressPanel.buttonCancel.onClick = function () {
          cancelExport = true;
          progressPanel.hide();
    }
    progressPanel.show();

   app.preferences.rulerUnits = Units.PIXELS

    var documentName = app.activeDocument.name;
    app.activeDocument = app.documents[documentName];
    var documentCopy = app.activeDocument.duplicate();
    documentCopy.activeLayer = documentCopy.layers[documentCopy.layers.length - 1];

    var elementNameQML = mainDialog.outputName.text;
	var elementNameJSON = mainDialog.outputName.text;
	
	var mainFolder = mainDialog.outputName.text;
	
	//QML
    if (elementNameQML.indexOf(".qml") == -1) 	// Append .qml unless not explicitly set
        elementNameQML += ".qml"
    var outputNameQML = exportInfo.destination + "/" + elementNameQML;
	//JSON	
    if (elementNameJSON.indexOf(".json") == -1) 	// Append .qml unless not explicitly set
        elementNameJSON += ".json"
    var outputNameJSON = exportInfo.destination + "/" + elementNameJSON;

	
    var imagefolder = new Folder(exportInfo.destination + "/" + mainFolder + "/");
    imagefolder.create();

    app.activeDocument.suspendHistory("export history", "");
    
    var exportQML = mainDialog.exportQML.value
    if (exportQML && !cancelExport) {
        qmlfile = new File(outputNameQML);
        qmlfile.encoding = "UTF8";
        qmlfile.open("w", "TEXT", "");
        qmlfile.write("import Qt 4.7\n");
        qmlfile.write("Item {\n");
        qmlfile.write("    width:" + app.activeDocument.width.as("px") + "\n");
        qmlfile.write("    height:" + app.activeDocument.height.as("px") + "\n");
    }
	var exportJSON = mainDialog.exportJSON.value
	if (exportJSON && !cancelExport) {
        jsonfile = new File(outputNameJSON);
        jsonfile.encoding = "UTF8";
        jsonfile.open("w", "TEXT", "");
        //jsonfile.write("JSON\n");
        jsonfile.write("{\n \"Item\": {\n");
        jsonfile.write("    \"width\":" + app.activeDocument.width.as("px") + ",\n");
        jsonfile.write("    \"height\":" + app.activeDocument.height.as("px") + ",\n");
    }
	
    countLayers(documentCopy) // For progressBar
    exportChildren(documentCopy, app.documents[documentName], exportInfo, documentCopy,"/" + mainFolder, exportInfo.fileNamePrefix);
	documentCopy.close(SaveOptions.DONOTSAVECHANGES);
	
    if (exportQML) {
        qmlfile.write("}\n");
        qmlfile.close();
    }
	if (exportJSON) {
        jsonfile.write("}\n}\n");
        jsonfile.close();
    }
    Panel.hide();
}


function setupDialog(exportInfo) {
    mainDialog = new Window("dialog", "Export Document To APP");
    var brush = mainDialog.graphics.newBrush(mainDialog.graphics.BrushType.THEME_COLOR, "appDialogBackground");
    mainDialog.graphics.backgroundColor = brush;
    mainDialog.graphics.disabledBackgroundColor = mainDialog.graphics.backgroundColor;
    mainDialog.orientation = 'column';
    mainDialog.alignChildren = 'left';

    mainDialog.groupFirstLine = mainDialog.add("group");
    mainDialog.groupFirstLine.orientation = 'row';
    mainDialog.groupFirstLine.alignChildren = 'left';
    mainDialog.groupFirstLine.alignment = 'fill';

    mainDialog.groupSecondLine = mainDialog.add("group");
    mainDialog.groupSecondLine.orientation = 'row';
    mainDialog.groupSecondLine.alignChildren = 'left';

    mainDialog.groupThirdLine = mainDialog.add("group");
    mainDialog.groupThirdLine.orientation = 'row';
    mainDialog.groupThirdLine.alignChildren = 'right';
    mainDialog.groupThirdLine.alignment = 'right';

    mainDialog.groupFourthLine = mainDialog.add("group");
    mainDialog.groupFourthLine.orientation = 'row';
    mainDialog.groupFourthLine.alignChildren = 'right';
    mainDialog.groupFourthLine.alignment = 'right';

    mainDialog.groupFirstLine.add("statictext", undefined, "Element Name:");
    mainDialog.groupSecondLine.add("statictext", undefined, "Output Folder:");

    mainDialog.outputName = mainDialog.groupFirstLine.add("edittext", undefined, "MyElement");
    mainDialog.outputName.preferredSize.width = 220
    mainDialog.rasterizeText = mainDialog.groupThirdLine.add("checkbox", undefined, "Rasterize Text");
    mainDialog.exportByGroup = mainDialog.groupThirdLine.add("checkbox", undefined, "Group layers");
    mainDialog.exportHidden = mainDialog.groupThirdLine.add("checkbox", undefined, "Export hidden");

    mainDialog.destinationFolder = mainDialog.groupSecondLine.add("edittext", undefined, "");
    mainDialog.destinationFolder.preferredSize.width = 220;
    mainDialog.buttonBrowse = mainDialog.groupSecondLine.add("button", undefined, "Browse..");
    
    mainDialog.exportQML = mainDialog.groupThirdLine.add("checkbox", undefined, "Export QML");
	mainDialog.exportJSON = mainDialog.groupThirdLine.add("checkbox", undefined, "Export JSON");
    mainDialog.buttonRun = mainDialog.groupFourthLine .add("button", undefined, "Export");
    mainDialog.defaultElement = mainDialog.buttonRun 
    
    mainDialog.buttonBrowse.onClick = function () {
        var defaultFolder = defaultFolder = "~";
        var selFolder = Folder.selectDialog("Select destination", defaultFolder);
        if (selFolder != null) 
            mainDialog.destinationFolder.text = selFolder.fsName;
    }

    mainDialog.buttonRun.onClick = function () {
        var destination = mainDialog.destinationFolder.text;
        if (destination.length == 0) {
            alert("you must specify a destination directory.");
            return;
        }

        var testFolder = new Folder(destination);
        if (!testFolder.exists) {
            alert("The destination directory does not exist.");
            return;
        }
        exportInfo.destination = destination;
        mainDialog.close(runButton);
     }

      mainDialog.buttonCancel = mainDialog.groupFourthLine .add("button", undefined, "Cancel");
      mainDialog.buttonCancel.onClick = function () {
        mainDialog.close(cancelButton);
    }

    try {
        // Try to read saved settings
        var desc = app.getCustomOptions(appString);
        mainDialog.outputName.text = desc.getString(outputNameKey);
        mainDialog.destinationFolder.text = desc.getString(destinationKey);
        mainDialog.rasterizeText.value = desc.getBoolean(rasterizeKey);
        mainDialog.exportByGroup.value = desc.getBoolean(exportByGroupKey);
        mainDialog.exportHidden.value = desc.getBoolean(exportHidden);
        mainDialog.exportQML.value = desc.getBoolean(exportQML);
		mainDialog.exportJSON.value = desc.getBoolean(exportJSON);
    }
    catch(e) {
        // Default settings on first run
        mainDialog.exportByGroup.value = true;
        mainDialog.exportHidden.value = false;
        mainDialog.exportQML.value = true;
		mainDialog.exportJSON.value = true;
    } // Use defaults
    
    app.bringToFront();
    mainDialog.defaultElement.active = true;
    mainDialog.center();

    var result = mainDialog.show();
    if (cancelButton != result) {
        var desc = new ActionDescriptor();
        desc.putString(outputNameKey, mainDialog.outputName.text);
        desc.putString(destinationKey, mainDialog.destinationFolder.text);
        desc.putBoolean(rasterizeKey, mainDialog.rasterizeText.value);
        desc.putBoolean(exportByGroupKey, mainDialog.exportByGroup.value);
        desc.putBoolean(exportHidden, mainDialog.exportHidden.value);
        desc.putBoolean(exportQML, mainDialog.exportQML.value);
		desc.putBoolean(exportJSON, mainDialog.exportJSON.value);
        app.putCustomOptions(appString, desc);
    }
    return result;
}

function countLayers(obj) {
    // Even when grouping layers, we export all layers at depth == 0
    for (var i = 0; i < obj.artLayers.length; i++) {
       layerCount++;
    }
    for (var i = 0; i < obj.layerSets.length; i++) { // Recursive
        if (!mainDialog.exportByGroup.value)
            countLayers(obj.layerSets[i]);
        layerCount++;
    }
}

function hideAll(obj) {
    for (var i = 0; i < obj.artLayers.length; i++) {
        obj.artLayers[i].allLocked = false;
        obj.artLayers[i].visible = false;
    }
    for (var i = 0; i < obj.layerSets.length; i++) { // Recursive
        hideAll(obj.layerSets[i]);
    }
}

function exportChildren(dupObj, orgObj, exportInfo, dupDocRef, folder, fileNamePrefix) {
    var exportQML = mainDialog.exportQML.value
	var exportJSON = mainDialog.exportJSON.value
    // Track names to detect duplicates
    var names = new Array;
    var uniqueCounter = 1;
	
    if (!mainDialog.exportByGroup.value )
        hideAll(dupObj)
	
    for (var i = dupObj.layers.length - 1; i >= 0 && !cancelExport ; i--) {
        progressPanel.myProgressBar.value = (layerIndex++)/layerCount
        var currentLayer = dupObj.layers[i];
        // Ensure unique layer names
        while (names[currentLayer.name]) {
            $.writeln("Warning: duplicate layer name: " + currentLayer.name); 
            currentLayer.name = orgObj.layers[i].name+  "_#" + uniqueCounter++;
        }
        names[currentLayer.name] = true;

        // Skip hidden layers
        var visible = true;
        if (!orgObj.layers[i].visible && orgObj.layers[i].name.substring(0,1) != "_") { //colin a tester
            visible = false   
        }
		if (!visible ) //&& !mainDialog.exportHidden.value)
            continue;
			
        if (!mainDialog.exportByGroup.value) {
			if (currentLayer.typename == "LayerSet")
			{
				//export group with _
				//if (dupObj.layers[i].name.substring(0,1)=="_")//colin a tester
				//{	
				//	for (var k = dupObj.layers.length - 1; k >= 0; k--)
				//	{
				//		dupObj.layers[k].visible = (k==i)
				//	}
				//}
				// Ignore layer groups and only show one layer at once
				//else //if (currentLayer.typename== "LayerSet") 
				
				continue;
			}
			else {
				dupObj.layers[i].visible = true
				if (!orgObj.layers[i].visible) dupObj.layers[i].visible = false //colin OK
				if (!orgObj.layers[i].name.substring(0,1) == "_") dupObj.layers[i].visible = true //colin OK
			}
			

        } else {
            // Hide all but current layergroup
			
			if (dupObj.layers[i].name.substring(0,1) == "_") dupObj.layers[i].visible = true //colin OK
			//if ((dupObj.layers[i].typename == "LayerSet" && dupObj.layers[i].name.substring(0,1)!= "_") 
			//    || ( dupObj.layers[i].parent.typename == "LayerSet" && dupObj.layers[i].typename != "LayerSet") )
			//{
			//	continue; //colin a tester
			//}
			if (dupObj.layers[i].typename == "LayerSet" && dupObj.layers[i].name.substring(0,1)!= "_") 
			{
				dupObj.layers[i].visible = true;
				var foldername = dupObj.layers[i].name;
				var foldertmp = folder + "/" + dupObj.layers[i].name;
				var imageLayerFolder = new Folder(exportInfo.destination + foldertmp + "/");
				imageLayerFolder.create();
	
				if (exportJSON) {
					// Write JSON NEW ITEM
					jsonfile.write("    \"" + foldername + "\" : {\n");
				}
			
				exportChildren(dupObj.layers[i], orgObj.layers[i], exportInfo, dupDocRef, foldertmp, fileNameBody); // recursive call
				
				if (exportJSON) {
					// Write JSON NEW ITEM
					if(i == 0) jsonfile.write("    }\n");
					else jsonfile.write("    },\n");
				}
				
				dupObj.layers[i].visible = false;
				continue;
			}
            else
			{
				//dupObj.layers[i].parent.parent.visible = true;
				//dupObj.layers[i].parent.visible = true;
				for (var k = dupObj.layers.length - 1; k >= 0; k--)
				{
					dupObj.layers[k].visible = (k==i)
				}
			}
        }
           
        //if (!visible ) //&& !mainDialog.exportHidden.value)
        //    continue;

        // Since we already save opacity, we dont want it affecting the output image
        var opacity = currentLayer.opacity / 100.0;
        currentLayer.opacity = 100;

        var layerName = dupObj.layers[i].name; // store layer name before change doc
        var fileNameBody = layerName.toLowerCase();

        // Ignore empty text layers
        if (currentLayer.kind == LayerKind.TEXT && currentLayer.textItem.contents == "") continue;
        var documentCopyTmp = dupDocRef.duplicate();

        // Trim copied document to layer bounds
        if (activeDocument.activeLayer.isBackgroundLayer == false) {
            // app.activeDocument.trim(TrimType.TRANSPARENT); 
            var bounds = currentLayer.bounds            
            activeDocument.crop (bounds, 0, bounds.width, bounds.height)
        }

        fileNameBody = fileNameBody.replace(/[ :\/\\*\?\"\<\>\|#]/g, "_"); // '/\:*?"<>|' -> '_'
        if (fileNameBody.length > 120) {
            fileNameBody = fileNameBody.substring(0, 120);
        }

        var isText = (currentLayer.kind == LayerKind.TEXT && !(mainDialog.rasterizeText.value))
        var filename = fileNameBody + ".png";
		
		var xoffset = currentLayer.bounds[0].as("px");
		var yoffset = currentLayer.bounds[1].as("px");
		var xoffset2 = currentLayer.bounds[2].as("px");
		var yoffset2 = currentLayer.bounds[3].as("px");
		var blendmode = currentLayer.blendMode;
			
			
        if (exportQML) {
            // Write QML  properties
            if (isText) qmlfile.write("    Text {\n");
            else qmlfile.write("    Image {\n");
            qmlfile.write("        id: " + fileNameBody + "\n");

            if (!visible)
                qmlfile.write("        visible: " + visible+ "\n");

            if (isText) {
                var textItem = currentLayer.textItem;
                qmlfile.write("        text: \"" + textItem.contents + "\"\n");

                // ### Temporary hack to set font positioning
                // Using pointsize doesnt work for some reason and we need to
                // figure out which metric we need to use ascending, perhaps?
                yoffset -= textItem.size.as("px") / 4;

                qmlfile.write("        font.pixelSize: " + Math.floor(textItem.size.as("px")) + "\n");

                //var fontfamily = app.textFonts.getByName(textitem.font);
                qmlfile.write("        font.family: \"" + textItem.font + "\"\n");

                if (textItem.font.indexOf("Bold") != -1) qmlfile.write("        font.bold: true\n");

                if (textItem.font.indexOf("Italic") != -1) qmlfile.write("        font.italic: true\n");
                qmlfile.write("        color: " + qtColor(currentLayer.textItem.color) + "\n");
                qmlfile.write("        smooth: true\n");
            } else {
                qmlfile.write("        \"source\": \"" + folder + "/" + filename + "\",\n");
            }
            qmlfile.write("        x: " + xoffset + "\n");
            qmlfile.write("        y: " + yoffset + "\n");
			qmlfile.write("        x2: " + xoffset2 + "\n");
			qmlfile.write("        y2: " + yoffset2 + "\n");
            qmlfile.write("        opacity: " + opacity + "\n");
			qmlfile.write("        blendmode: " + blendmode + "\n");
            qmlfile.write("    }\n");
        }
		
		 if (exportJSON) {
            // Write JSON  properties
            if (isText) jsonfile.write("    \"Text\" : {\n");
            else jsonfile.write("    \"Image\" : {\n");
            jsonfile.write("        \"id\": \"" + fileNameBody + "\",\n");

            if (!visible)
                jsonfile.write("        \"visible\": " + visible+ ",\n");	
            if (isText) {
                var textItem = currentLayer.textItem;
                jsonfile.write("        \"text\": \"" + textItem.contents + "\"\n");

                // ### Temporary hack to set font positioning
                // Using pointsize doesnt work for some reason and we need to
                // figure out which metric we need to use ascending, perhaps?
                yoffset -= textItem.size.as("px") / 4;

                jsonfile.write("        \"font.pixelSize\": " + Math.floor(textItem.size.as("px")) + ",\n");

                //var fontfamily = app.textFonts.getByName(textitem.font);
                jsonfile.write("        \"font.family\": \"" + textItem.font + "\",\n");

                if (textItem.font.indexOf("Bold") != -1) jsonfile.write("        \"font.bold\": \"true\",\n");

                if (textItem.font.indexOf("Italic") != -1) jsonfile.write("        \"font.italic\": \"true\",\n");
                jsonfile.write("        \"color\": " + qtColor(currentLayer.textItem.color) + ",\n");
                jsonfile.write("        \"smooth\": \"true\",\n");
            } else {
                jsonfile.write("        \"source\": \"" + folder + "/" + filename + "\",\n");
            }
            jsonfile.write("        \"x\": " + xoffset + ",\n");
            jsonfile.write("        \"y\": " + yoffset + ",\n");
			jsonfile.write("        \"x2\": " + xoffset2 + ",\n");
			jsonfile.write("        \"y2\": " + yoffset2 + ",\n");
            jsonfile.write("        \"opacity\": " + opacity + ",\n");
			jsonfile.write("        \"blendmode\": \"" + blendmode + "\"\n");
            if(i == 0) jsonfile.write("    }\n");
			else jsonfile.write("    },\n");
        }
		
        // Save document
        if (!isText) {
            var saveFile = new File(exportInfo.destination + folder + "/" + filename);
            pngSaveOptions = new PNGSaveOptions();
            pngSaveOptions.interlaced = false;
            documentCopyTmp.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE);
        }

        // Close tempfile
        documentCopyTmp.close(SaveOptions.DONOTSAVECHANGES);

        //if (!mainDialog.exportByGroup.value )
            dupObj.layers[i].visible = false
    }

    for (var i = 0; i < dupObj.layerSets.length; i++) {
        var fileNameBody = fileNamePrefix;
        fileNameBody += "_" + "s";
        if (!mainDialog.exportByGroup.value )
            exportChildren(dupObj.layerSets[i], orgObj.layerSets[i], exportInfo, dupDocRef, folder, fileNameBody); // recursive call
    }
}

function collectLayerSets (theParent) {
    if (!allLayerSets) {
        var allLayerSets = new Array
    }
    for (var m = theParent.layers.length - 1; m >= 0;m--) {
        var theLayer = theParent.layers[m];
        // No need to process hidden layers
        if (theLayer.typename == "LayerSet") {
            allLayerSets = allLayerSets.concat(theLayer);
            allLayerSets = allLayerSets.concat(collectLayerSets(theLayer))
        }
    }
    return allLayerSets
};
