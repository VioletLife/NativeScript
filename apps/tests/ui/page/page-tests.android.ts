﻿import PageModule = require("ui/page");
import TKUnit = require("../../TKUnit");
import LabelModule = require("ui/label");
import PageTestCommon = require("./page-tests-common");
import helper = require("../helper");
import frame = require("ui/frame");

global.moduleMerge(PageTestCommon, exports);

export var test_NavigateToNewPage_WithAndroidCache = function () {
    var testPage: PageModule.Page;
    var pageFactory = function (): PageModule.Page {
        testPage = new PageModule.Page();
        var label = new LabelModule.Label();
        label.text = "The quick brown fox jumps over the lazy dog.";
        testPage.content = label;
        return testPage;
    };

    var androidFrame = frame.topmost().android;
    var cachingBefore = androidFrame.cachePagesOnNavigate;
    try {
        androidFrame.cachePagesOnNavigate = true;

        helper.navigate(pageFactory);

        helper.goBack();
    }
    finally {
        androidFrame.cachePagesOnNavigate = cachingBefore;
    }

    TKUnit.assert(testPage.parent === undefined, "Page.parent should become undefined after navigating back");
    TKUnit.assert(testPage.isLoaded === false, "Page.isLoaded should become false after navigating back");
    TKUnit.assert(testPage.frame === undefined, "Page.frame should become undefined after navigating back");
    TKUnit.assert(testPage._isAddedToNativeVisualTree === false, "Page._isAddedToNativeVisualTree should become false after navigating back");
}

export var test_NavigateToNewPage_InnerControl_WithAndroidCache = function () {
    var testPage: PageModule.Page;
    var label: LabelModule.Label;
    var pageFactory = function () {
        testPage = new PageModule.Page();
        label = new LabelModule.Label();
        label.text = "The quick brown fox jumps over the lazy dog.";
        testPage.content = label;
        return testPage;
    };

    var androidFrame = frame.topmost().android;
    var cachingBefore = androidFrame.cachePagesOnNavigate;
    try {
        androidFrame.cachePagesOnNavigate = true;

        helper.navigate(pageFactory);

        helper.goBack();
    }
    finally {
        androidFrame.cachePagesOnNavigate = cachingBefore;
    }

    TKUnit.assert(label._context === undefined, "InnerControl._context should not be set after navigate back.");
    TKUnit.assert(label.android === undefined, "InnerControl.android should not be set after navigate back.");
    TKUnit.assert(label._nativeView === undefined, "InnerControl._nativeView hould not be set after navigate back.");
    TKUnit.assert(label.isLoaded === false, "InnerControl.isLoaded should become false after navigating back");
    TKUnit.assert(label._isAddedToNativeVisualTree === false, "InnerControl._isAddedToNativeVisualTree should not be true after navigating back");
}

export var test_NavigateToNewPage_InnerControl = function () {
    var testPage: PageModule.Page;
    var pageFactory = function () {
        testPage = new PageModule.Page();
        PageTestCommon.addLabelToPage(testPage);
        return testPage;
    };

    helper.navigate(pageFactory);

    helper.goBack();

    var label = <LabelModule.Label>testPage.content;  

    TKUnit.assert(label._context === undefined, "InnerControl._context should be undefined after navigate back.");
    TKUnit.assert(label.android === undefined, "InnerControl.android should be undefined after navigate back.");
    TKUnit.assert(label._nativeView === undefined, "InnerControl._nativeView should be undefined after navigate back.");
    TKUnit.assert(label.isLoaded === false, "InnerControl.isLoaded should become false after navigating back");
    TKUnit.assert(label._isAddedToNativeVisualTree === false, "InnerControl._isAddedToNativeVisualTree should become false after navigating back");
}

export var test_ChangePageCaching_AfterNavigated_Throws = function () {
    var testPage: PageModule.Page;
    var pageFactory = function () {
        var testPage = new PageModule.Page();
        testPage.content = new LabelModule.Label();
        return testPage;
    };

    var androidFrame = frame.topmost().android;
    var cachingBefore = androidFrame.cachePagesOnNavigate;
    
    helper.navigate(pageFactory);
    
    try {
        TKUnit.assertThrows(() => {
            // Set caching to different value.
            androidFrame.cachePagesOnNavigate = !cachingBefore;
        },
            "Changing cachePagesOnNavigate value after navigations should throw error.",
            "Cannot set cachePagesOnNavigate if there are items in the back stack."
            );
    }
    finally {
        helper.goBack();
        androidFrame.cachePagesOnNavigate = cachingBefore;
    }
}

export var test_SetPageCaching_ToTheSameValue_AfterNavigated_DoesNotThrow = function () {
    var testPage: PageModule.Page;
    var pageFactory = function () {
        var testPage = new PageModule.Page();
        testPage.content = new LabelModule.Label();
        return testPage;
    };

    var androidFrame = frame.topmost().android;
    var cachingBefore = androidFrame.cachePagesOnNavigate;
    
    helper.navigate(pageFactory);
    
    try {
        // Set caching to same value.
        androidFrame.cachePagesOnNavigate = cachingBefore;
    }
    finally {
        helper.goBack();
        androidFrame.cachePagesOnNavigate = cachingBefore;
    }
}

export var test_ChangePageCaching_BeforeNavigated_DoesNotThrow = function () {
    var androidFrame = frame.topmost().android;
    var cachingBefore = androidFrame.cachePagesOnNavigate;
    try {
        androidFrame.cachePagesOnNavigate = !cachingBefore;
    }
    catch (e) {
        TKUnit.assert(false, "Changing cachePagesOnNavigate before navigation should not throw.");
    }
    finally {
        androidFrame.cachePagesOnNavigate = cachingBefore;
    }
}
