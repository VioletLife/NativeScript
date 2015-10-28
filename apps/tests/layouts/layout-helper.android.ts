﻿import button = require("ui/button");
import {StackLayout} from "ui/layouts/stack-layout";
import utils = require("utils/utils");
import TKUnit = require("../TKUnit");
import def = require("./layout-helper");

var DELTA = 0.1;

export class NativeButton extends android.widget.Button {
    
    private owner: MyButton;

    constructor(context: android.content.Context, owner: MyButton) {
        super(context);
        this.owner = owner;
        return global.__native(this);
    }

    protected onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        this.owner._oldWidthMeasureSpec = widthMeasureSpec;
        this.owner._oldHeightMeasureSpec = heightMeasureSpec;

        this.owner._measureWidth = utils.layout.getMeasureSpecSize(widthMeasureSpec);
        this.owner._measureHeight = utils.layout.getMeasureSpecSize(heightMeasureSpec);
        this.owner.measureCount++;
    }

    protected onLayout(changed: boolean, left: number, top: number, right: number, bottom: number): void {
        this.owner._layoutLeft = left;
        this.owner._layoutTop = top;
        this.owner._layoutWidth = right - left;
        this.owner._layoutHeight = bottom - top;

        super.onLayout(changed, left, top, right, bottom);
        this.owner.arrangeCount++;
    }
}

export class MyButton extends button.Button implements def.MyButton {
    private _layout: NativeButton;

    get android(): NativeButton {
        return this._layout;
    }

    get _nativeView(): NativeButton {
        return this._layout;
    }

    public _createUI() {
        this._layout = new NativeButton(this._context, this);
    }

    public measureCount: number = 0;
    public arrangeCount: number = 0;

    _oldWidthMeasureSpec: number = Number.NaN;
    _oldHeightMeasureSpec: number = Number.NaN;

    _layoutLeft;
    _layoutTop;
    _layoutWidth;
    _layoutHeight;

    _measureWidth;
    _measureHeight;

    public get measured(): boolean {
        return this.measureCount > 0;
    }

    public get arranged(): boolean {
        return this.arrangeCount > 0;
    }

    get measureHeight(): number {
        return this._measureHeight;
    }

    get measureWidth(): number {
        return this._measureWidth;
    }

    get layoutWidth(): number {
        return this._layoutWidth;
    }

    get layoutHeight(): number {
        return this._layoutHeight;
    }
    
    get layoutLeft(): number {
        return this._layoutLeft;
    }

    get layoutTop(): number {
        return this._layoutTop;
    }

    _getCurrentMeasureSpecs(): { widthMeasureSpec: number; heightMeasureSpec: number } {
        return {
            widthMeasureSpec: this._oldWidthMeasureSpec,
            heightMeasureSpec: this._oldHeightMeasureSpec
        };
    }
}

export class NativeStackLayout extends org.nativescript.widgets.StackLayout {
 
    private owner: MyStackLayout;

    constructor(context: android.content.Context, owner: MyStackLayout) {
        super(context);
        this.owner = owner;
        return global.__native(this);
    }

    protected onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        this.owner.measureCount++;
    }

    protected onLayout(changed: boolean, left: number, top: number, right: number, bottom: number): void {
        super.onLayout(changed, left, top, right, bottom);
        this.owner.arrangeCount++;
    }
}

export class MyStackLayout extends StackLayout implements def.MyStackLayout {
    private _layout: NativeStackLayout;

    get android(): NativeStackLayout {
        return this._layout;
    }

    get _nativeView(): NativeStackLayout {
        return this._layout;
    }

    public _createUI() {
        this._layout = new NativeStackLayout(this._context, this);
    }

    public measureCount: number = 0;
    public arrangeCount: number = 0;

    public get measured(): boolean {
        return this.measureCount > 0;
    }

    public get arranged(): boolean {
        return this.arrangeCount > 0;
    }
}

export function assertMeasure(btn: MyButton, width: number, height: number, name?: string) {
    var density = utils.layout.getDisplayDensity();

    var delta = Math.floor(density) !== density ? 1.1 : DELTA;
    name = name ? "[" + name + "]" : "";

    TKUnit.assertAreClose(Math.floor(btn.measureWidth / density), width, delta, name + "width");
    TKUnit.assertAreClose(Math.floor(btn.measureHeight / density), height, delta, name + "height");
}

export function assertLayout(btn: MyButton, left: number, top: number, width: number, height: number, name?: string): void {
    var density = utils.layout.getDisplayDensity();

    var delta = Math.floor(density) !== density ? 1.1 : DELTA;
    name = name ? "[" + name + "]" : "";

    TKUnit.assertAreClose(Math.floor(btn.layoutLeft / density), left, delta, name + "left");
    TKUnit.assertAreClose(Math.floor(btn.layoutTop / density), top, delta, name + "top");
    TKUnit.assertAreClose(Math.floor(btn.layoutWidth / density), width, delta, name + "width");
    TKUnit.assertAreClose(Math.floor(btn.layoutHeight / density), height, delta, name + "height");
}

export function dip(value: number): number {
    var density = utils.layout.getDisplayDensity();
    return Math.floor(value * density);
}
