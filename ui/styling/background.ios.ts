import viewModule = require("ui/core/view");
import style = require("./style");
import common = require("./background-common");

global.moduleMerge(common, exports);

export module ios {
    export function createBackgroundUIColor(view: viewModule.View): UIColor {
        if(!view._nativeView){
            return null;
        }
        
        var background = <common.Background> view.style._getValue(style.backgroundInternalProperty);
        var frame = (<UIView>view._nativeView).frame;
        var boundsWidth = frame.size.width;
        var boundsHeight = frame.size.height;
        var result: UIColor;

        if (background && !background.isEmpty() && boundsWidth > 0 && boundsHeight) {
            if (!background.image) {
                result = background.color.ios;
            }
            else {
                var img = <UIImage>background.image.ios;
                var params = background.getDrawParams(boundsWidth, boundsHeight);

                if (params.sizeX > 0 && params.sizeY > 0) {
                    var resizeRect = CGRectMake(0, 0, params.sizeX, params.sizeY);
                    UIGraphicsBeginImageContext(resizeRect.size);
                    img.drawInRect(resizeRect);
                    img = UIGraphicsGetImageFromCurrentImageContext();
                    UIGraphicsEndImageContext();
                }

                UIGraphicsBeginImageContextWithOptions(frame.size, false, 0.0);
                var context = UIGraphicsGetCurrentContext();

                if (background.color && background.color.ios) {
                    CGContextSetFillColorWithColor(context, background.color.ios.CGColor);
                    CGContextFillRect(context, CGRectMake(0, 0, boundsWidth, boundsHeight));
                }

                if (!params.repeatX && !params.repeatY) {
                    img.drawAtPoint(CGPointMake(params.posX, params.posY));
                }
                else {
                    var w = params.repeatX ? boundsWidth : img.size.width;
                    var h = params.repeatY ? boundsHeight : img.size.height;

                    CGContextSetPatternPhase(context, CGSizeMake(params.posX, params.posY));

                    params.posX = params.repeatX ? 0 : params.posX;
                    params.posY = params.repeatY ? 0 : params.posY;

                    var patternRect = CGRectMake(params.posX, params.posY, w, h);

                    img.drawAsPatternInRect(patternRect);
                }
                var bkgImage = UIGraphicsGetImageFromCurrentImageContext();
                UIGraphicsEndImageContext();
                result = UIColor.alloc().initWithPatternImage(bkgImage);
            }
            return result;
        }
    }
}
