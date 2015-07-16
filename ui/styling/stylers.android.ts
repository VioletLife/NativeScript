﻿import types = require("utils/types");
import view = require("ui/core/view");
import constants = require("utils/android_constants");
import style = require("ui/styling/style");
import definition = require("ui/styling");
import stylersCommon = require("ui/styling/stylers-common");
import enums = require("ui/enums");
import utils = require("utils/utils");
import styleModule = require("ui/styling/style");
import font = require("ui/styling/font");
import background = require("ui/styling/background");

// merge the exports of the common file with the exports of this file
declare var exports;
require("utils/module-merge").merge(stylersCommon, exports);

var _defaultBackgrounds = new Map<string, android.graphics.drawable.Drawable>();
function onBackgroundOrBorderPropertyChanged(v: view.View) {
    if (!v._nativeView) {
        return;
    }

    var backgroundValue = <background.Background>v.style._getValue(styleModule.backgroundInternalProperty);

    if (v.borderWidth !== 0 || v.borderRadius !== 0 || !backgroundValue.isEmpty()) {
        var nativeView = <android.view.View>v._nativeView;

        var bkg = <background.ad.BorderDrawable>nativeView.getBackground();
        if (!(bkg instanceof background.ad.BorderDrawable)) {
            bkg = new background.ad.BorderDrawable();
            let viewClass = types.getClass(v);
            if (!_defaultBackgrounds.has(viewClass)) {
                _defaultBackgrounds.set(viewClass, nativeView.getBackground());
            }

            nativeView.setBackground(bkg);
        }

        var padding = v.borderWidth * utils.layout.getDisplayDensity();

        nativeView.setPadding(padding, padding, padding, padding);

        bkg.borderWidth = v.borderWidth;
        bkg.cornerRadius = v.borderRadius;
        bkg.borderColor = v.borderColor ? v.borderColor.android : android.graphics.Color.TRANSPARENT;
        bkg.background = backgroundValue;
    }
    else {
        // reset the value with the default native value
        let viewClass = types.getClass(v);
        if (_defaultBackgrounds.has(viewClass)) {
            v.android.setBackgroundDrawable(_defaultBackgrounds.get(viewClass));
        }
    }
        }

export class DefaultStyler implements definition.stylers.Styler {
    //Background and borders methods
    private static setBackgroundBorderProperty(view: view.View, newValue: any, defaultValue: any) {
        onBackgroundOrBorderPropertyChanged(view);
    }

    private static resetBackgroundBorderProperty(view: view.View, nativeValue: any) {
        onBackgroundOrBorderPropertyChanged(view);
    }

    //Visibility methods
    private static setVisibilityProperty(view: view.View, newValue: any) {
        var androidValue = (newValue === enums.Visibility.visible) ? android.view.View.VISIBLE : android.view.View.GONE;
        (<android.view.View>view.android).setVisibility(androidValue);
    }

    private static resetVisibilityProperty(view: view.View, nativeValue: any) {
        (<android.view.View>view.android).setVisibility(android.view.View.VISIBLE);
    }

    //Opacity methods
    private static setOpacityProperty(view: view.View, newValue: any) {
        (<android.view.View>view.android).setAlpha(float(newValue));
    }

    private static resetOpacityProperty(view: view.View, nativeValue: any) {
        (<android.view.View>view.android).setAlpha(float(1.0));
    }

    //minWidth methods
    private static setMinWidthProperty(view: view.View, newValue: any) {
        (<android.view.View>view._nativeView).setMinimumWidth(newValue * utils.layout.getDisplayDensity());
    }

    private static resetMinWidthProperty(view: view.View, nativeValue: any) {
        (<android.view.View>view._nativeView).setMinimumWidth(0);
    }

    //minHeight methods
    private static setMinHeightProperty(view: view.View, newValue: any) {
        (<android.view.View>view._nativeView).setMinimumHeight(newValue * utils.layout.getDisplayDensity());
    }

    private static resetMinHeightProperty(view: view.View, nativeValue: any) {
        (<android.view.View>view._nativeView).setMinimumHeight(0);
    }

    private static setNativeLayoutParamsProperty(view: view.View, params: style.CommonLayoutParams): void {
        var nativeView: android.view.View = view._nativeView;

        var lp = <org.nativescript.widgets.CommonLayoutParams>nativeView.getLayoutParams();
        if (!(lp instanceof org.nativescript.widgets.CommonLayoutParams)) {
            lp = new org.nativescript.widgets.CommonLayoutParams();
        }
        
        lp.leftMargin = params.leftMargin * utils.layout.getDisplayDensity();
        lp.topMargin = params.topMargin * utils.layout.getDisplayDensity();
        lp.rightMargin = params.rightMargin * utils.layout.getDisplayDensity();
        lp.bottomMargin = params.bottomMargin * utils.layout.getDisplayDensity();

        var width = params.width * utils.layout.getDisplayDensity();
        var height = params.height * utils.layout.getDisplayDensity();
        
        // If width is not specified set it as WRAP_CONTENT
        if (width < 0) {
            width = -2;
        }

        // If height is not specified set it as WRAP_CONTENT
        if (lp.height < 0) {
            lp.height = -2;
        }

        var gravity = 0;
        switch (params.horizontalAlignment) {
            case enums.HorizontalAlignment.left:
               	gravity |= android.view.Gravity.LEFT;
                break;

            case enums.HorizontalAlignment.center:
                gravity |= android.view.Gravity.CENTER_HORIZONTAL;
                break;

            case enums.HorizontalAlignment.right:
                gravity |= android.view.Gravity.RIGHT;
                break;

            case enums.HorizontalAlignment.stretch:
                gravity |= android.view.Gravity.FILL_HORIZONTAL;
                 // If width is not specified set it as MATCH_PARENT
                if (width < 0) {
                    width = -1;
                }
                break;

            default:
                throw new Error("Invalid horizontalAlignment value: " + params.horizontalAlignment);
        }

        switch (params.verticalAlignment) {
            case enums.VerticalAlignment.top:
                gravity |= android.view.Gravity.TOP;
                break;

            case enums.VerticalAlignment.center:
                gravity |= android.view.Gravity.CENTER_VERTICAL;
                break;

            case enums.VerticalAlignment.bottom:
                gravity |= android.view.Gravity.BOTTOM;
                break;

            case enums.VerticalAlignment.stretch:
                gravity |= android.view.Gravity.FILL_VERTICAL;
                // If height is not specified set it as MATCH_PARENT
                if (height < 0) {
                    height = -1;
                }
                break;

            default:
                throw new Error("Invalid verticalAlignment value: " + params.verticalAlignment);
        }

        lp.width = width;
        lp.height = height;
        lp.gravity = gravity;
        nativeView.setLayoutParams(lp);
    }

    private static resetNativeLayoutParamsProperty(view: view.View, nativeValue: any): void {
        var nativeView: android.view.View = view._nativeView;
        nativeView.setLayoutParams(new org.nativescript.widgets.CommonLayoutParams());
    }

    public static registerHandlers() {
        style.registerHandler(style.visibilityProperty, new stylersCommon.StylePropertyChangedHandler(
            DefaultStyler.setVisibilityProperty,
            DefaultStyler.resetVisibilityProperty));

        style.registerHandler(style.opacityProperty, new stylersCommon.StylePropertyChangedHandler(
            DefaultStyler.setOpacityProperty,
            DefaultStyler.resetOpacityProperty));

        style.registerHandler(style.minWidthProperty, new stylersCommon.StylePropertyChangedHandler(
            DefaultStyler.setMinWidthProperty,
            DefaultStyler.resetMinWidthProperty));

        style.registerHandler(style.minHeightProperty, new stylersCommon.StylePropertyChangedHandler(
            DefaultStyler.setMinHeightProperty,
            DefaultStyler.resetMinHeightProperty))

        // Use the same handler for all background/border properties
        // Note: There is no default value getter - the default value is handled in onBackgroundOrBorderPropertyChanged
        var borderHandler = new stylersCommon.StylePropertyChangedHandler(
            DefaultStyler.setBackgroundBorderProperty,
            DefaultStyler.resetBackgroundBorderProperty);

        style.registerHandler(style.backgroundInternalProperty, borderHandler);
        style.registerHandler(style.borderWidthProperty, borderHandler);
        style.registerHandler(style.borderColorProperty, borderHandler);
        style.registerHandler(style.borderRadiusProperty, borderHandler);

        style.registerHandler(style.nativeLayoutParamsProperty, new stylersCommon.StylePropertyChangedHandler(
            DefaultStyler.setNativeLayoutParamsProperty,
            DefaultStyler.resetNativeLayoutParamsProperty));
    }
}

export class TextViewStyler implements definition.stylers.Styler {
    // color
    private static setColorProperty(view: view.View, newValue: any) {
        (<android.widget.TextView>view.android).setTextColor(newValue);
    }

    private static resetColorProperty(view: view.View, nativeValue: any) {
        (<android.widget.TextView>view.android).setTextColor(nativeValue);
    }

    private static getNativeColorValue(view: view.View): any {
        return (<android.widget.TextView>view.android).getTextColors().getDefaultColor();
    }

    // font
    private static setFontInternalProperty(view: view.View, newValue: any, nativeValue: any) {
        var tv = <android.widget.TextView>view.android;
        var fontValue = <font.Font>newValue;

        var typeface = fontValue.getAndroidTypeface();
        if (typeface) {
            tv.setTypeface(typeface);
        }
        else {
            tv.setTypeface(nativeValue.typeface);
        }

        if (fontValue.fontSize) {
            tv.setTextSize(fontValue.fontSize);
    }
        else {
            tv.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, nativeValue.size);
        }
    }

    private static resetFontInternalProperty(view: view.View, nativeValue: any) {
        var tv: android.widget.TextView = <android.widget.TextView>view.android;
        tv.setTypeface(nativeValue.typeface);
        tv.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, nativeValue.size);
    }

    private static getNativeFontInternalValue(view: view.View): any {
        var tv: android.widget.TextView = <android.widget.TextView>view.android;
        return {
            typeface: tv.getTypeface(),
            size: tv.getTextSize()
        };
    }

    // text-align
    private static setTextAlignmentProperty(view: view.View, newValue: any) {
        var verticalGravity = view.android.getGravity() & android.view.Gravity.VERTICAL_GRAVITY_MASK;
        switch (newValue) {
            case enums.TextAlignment.left:
                view.android.setGravity(android.view.Gravity.LEFT | verticalGravity);
                break;
            case enums.TextAlignment.center:
                view.android.setGravity(android.view.Gravity.CENTER_HORIZONTAL | verticalGravity);
                break;
            case enums.TextAlignment.right:
                view.android.setGravity(android.view.Gravity.RIGHT | verticalGravity);
                break;
            default:
                break;
        }
    }

    private static resetTextAlignmentProperty(view: view.View, nativeValue: any) {
        view.android.setGravity(nativeValue);
    }

    private static getNativeTextAlignmentValue(view: view.View): any {
        return view.android.getGravity();
    }

    public static registerHandlers() {
        style.registerHandler(style.colorProperty, new stylersCommon.StylePropertyChangedHandler(
            TextViewStyler.setColorProperty,
            TextViewStyler.resetColorProperty,
            TextViewStyler.getNativeColorValue), "TextBase");

        style.registerHandler(style.fontInternalProperty, new stylersCommon.StylePropertyChangedHandler(
            TextViewStyler.setFontInternalProperty,
            TextViewStyler.resetFontInternalProperty,
            TextViewStyler.getNativeFontInternalValue), "TextBase");

        style.registerHandler(style.textAlignmentProperty, new stylersCommon.StylePropertyChangedHandler(
            TextViewStyler.setTextAlignmentProperty,
            TextViewStyler.resetTextAlignmentProperty,
            TextViewStyler.getNativeTextAlignmentValue), "TextBase");

        // Register the same stylers for Button.
        // It also derives from TextView but is not under TextBase in our View hierarchy.
        style.registerHandler(style.colorProperty, new stylersCommon.StylePropertyChangedHandler(
            TextViewStyler.setColorProperty,
            TextViewStyler.resetColorProperty,
            TextViewStyler.getNativeColorValue), "Button");

        style.registerHandler(style.fontInternalProperty, new stylersCommon.StylePropertyChangedHandler(
            TextViewStyler.setFontInternalProperty,
            TextViewStyler.resetFontInternalProperty,
            TextViewStyler.getNativeFontInternalValue), "Button");

        style.registerHandler(style.textAlignmentProperty, new stylersCommon.StylePropertyChangedHandler(
            TextViewStyler.setTextAlignmentProperty,
            TextViewStyler.resetTextAlignmentProperty,
            TextViewStyler.getNativeTextAlignmentValue), "Button");

    }
}

export class ActivityIndicatorStyler implements definition.stylers.Styler {
    //Visibility methods
    public static setActivityIndicatorVisibilityProperty(view: view.View, newValue: any) {
        ActivityIndicatorStyler.setIndicatorVisibility((<any>view).busy, newValue, view.android);
    }

    public static resetActivityIndicatorVisibilityProperty(view: view.View, nativeValue: any) {
        ActivityIndicatorStyler.setIndicatorVisibility((<any>view).busy, enums.Visibility.visible, view.android);
    }

    public static setIndicatorVisibility(isBusy: boolean, visibility: string, nativeView: android.view.View) {
        if (visibility === enums.Visibility.collapsed || visibility === enums.Visibility.collapse) {
            nativeView.setVisibility(android.view.View.GONE);
        }
        else {
            nativeView.setVisibility(isBusy ? android.view.View.VISIBLE : android.view.View.INVISIBLE);
        }
    }

    public static registerHandlers() {
        style.registerHandler(style.visibilityProperty, new stylersCommon.StylePropertyChangedHandler(
            ActivityIndicatorStyler.setActivityIndicatorVisibilityProperty,
            ActivityIndicatorStyler.resetActivityIndicatorVisibilityProperty), "ActivityIndicator");
    }
}

export class SegmentedBarStyler implements definition.stylers.Styler {
    //Text color methods
    private static setColorProperty(view: view.View, newValue: any) {
        var tabHost = <android.widget.TabHost>view.android;

        for (var tabIndex = 0; tabIndex < tabHost.getTabWidget().getTabCount(); tabIndex++) {
            var tab = <android.view.ViewGroup>tabHost.getTabWidget().getChildTabViewAt(tabIndex);
            var t = <android.widget.TextView>tab.getChildAt(1);
            t.setTextColor(newValue);
        }
    }

    private static resetColorProperty(view: view.View, nativeValue: any) {
        var tabHost = <android.widget.TabHost>view.android;

        for (var tabIndex = 0; tabIndex < tabHost.getTabWidget().getTabCount(); tabIndex++) {
            var tab = <android.view.ViewGroup>tabHost.getTabWidget().getChildTabViewAt(tabIndex);
            var t = <android.widget.TextView>tab.getChildAt(1);
            t.setTextColor(constants.btn_default);
        }
    }

    public static registerHandlers() {
        style.registerHandler(style.colorProperty, new stylersCommon.StylePropertyChangedHandler(
            SegmentedBarStyler.setColorProperty,
            SegmentedBarStyler.resetColorProperty), "SegmentedBar");
    }
}

export class SearchBarStyler implements definition.stylers.Styler {

    private static getBackgroundColorProperty(view: view.View): any {
        var bar = <android.widget.SearchView>view.android;
        return bar.getDrawingCacheBackgroundColor();
    }

    private static setBackgroundColorProperty(view: view.View, newValue: any) {
        var bar = <android.widget.SearchView>view.android;
        bar.setBackgroundColor(newValue);
        SearchBarStyler._changeSearchViewPlateBackgroundColor(bar, newValue);
    }

    private static resetBackgroundColorProperty(view: view.View, nativeValue: any) {
        var bar = <android.widget.SearchView>view.android;
        bar.setBackgroundColor(nativeValue);
        SearchBarStyler._changeSearchViewPlateBackgroundColor(bar, nativeValue);
    }

    private static getColorProperty(view: view.View): any {
        var bar = <android.widget.SearchView>view.android;
        var textView = SearchBarStyler._getSearchViewTextView(bar);

        if (textView) {
            return textView.getCurrentTextColor();
        }

        return undefined;
    }

    private static setColorProperty(view: view.View, newValue: any) {
        var bar = <android.widget.SearchView>view.android;
        SearchBarStyler._changeSearchViewTextColor(bar, newValue);
    }

    private static resetColorProperty(view: view.View, nativeValue: any) {
        var bar = <android.widget.SearchView>view.android;
        SearchBarStyler._changeSearchViewTextColor(bar, nativeValue);
    }

    public static registerHandlers() {
        style.registerHandler(style.backgroundColorProperty, new stylersCommon.StylePropertyChangedHandler(
            SearchBarStyler.setBackgroundColorProperty,
            SearchBarStyler.resetBackgroundColorProperty,
            SearchBarStyler.getBackgroundColorProperty), "SearchBar");

        style.registerHandler(style.colorProperty, new stylersCommon.StylePropertyChangedHandler(
            SearchBarStyler.setColorProperty,
            SearchBarStyler.resetColorProperty,
            SearchBarStyler.getColorProperty), "SearchBar");
    }

    private static _getSearchViewTextView(bar: android.widget.SearchView): android.widget.TextView {
        var id = bar.getContext().getResources().getIdentifier("android:id/search_src_text", null, null);
        return <android.widget.TextView> bar.findViewById(id);
    }

    private static _changeSearchViewTextColor(bar: android.widget.SearchView, color: number) {
        var textView = SearchBarStyler._getSearchViewTextView(bar);
        if (textView) {
            textView.setTextColor(color);
        }
    }

    private static _changeSearchViewPlateBackgroundColor(bar: android.widget.SearchView, color: number) {
        var id = bar.getContext().getResources().getIdentifier("android:id/search_plate", null, null);
        var textView = <android.view.View> bar.findViewById(id);
        if (textView) {
            textView.setBackgroundColor(color);
        }
    }
}

export class LayoutBaseStyler implements definition.stylers.Styler {
    
    //nativePadding methods
    private static setPaddingNativeProperty(view: view.View, newValue: style.Thickness): void {
        var left = (newValue.left * utils.layout.getDisplayDensity());
        var top = (newValue.top * utils.layout.getDisplayDensity());
        var right = (newValue.right * utils.layout.getDisplayDensity());
        var bottom = (newValue.bottom * utils.layout.getDisplayDensity());
        (<android.view.View>view._nativeView).setPadding(left, top, right, bottom);
    }

    private static resetPaddingNativeProperty(view: view.View, nativeValue: any): void {
        (<android.view.View>view._nativeView).setPadding(0, 0, 0, 0);
    }

    public static registerHandlers() {
        style.registerHandler(style.nativePaddingsProperty, new stylersCommon.StylePropertyChangedHandler(
            LayoutStyler.setPaddingNativeProperty,
            LayoutStyler.resetPaddingNativeProperty), "Layout");
    }
}

// Register all styler at the end.
export function _registerDefaultStylers() {
    style.registerNoStylingClass("Frame");
    DefaultStyler.registerHandlers();
    TextViewStyler.registerHandlers();
    ActivityIndicatorStyler.registerHandlers();
    SegmentedBarStyler.registerHandlers();
    SearchBarStyler.registerHandlers();
    LayoutBaseStyler.registerHandlers();
}
