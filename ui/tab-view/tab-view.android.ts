import common = require("./tab-view-common");
import definition = require("ui/tab-view");
import dependencyObservable = require("ui/core/dependency-observable");
import view = require("ui/core/view");
import trace = require("trace");
import types = require("utils/types");
import utils = require("utils/utils");
import imageSource = require("image-source");
import proxy = require("ui/core/proxy");
import color = require("color");

var VIEWS_STATES = "_viewStates";
var ACCENT_COLOR = "colorAccent";
var PRIMARY_COLOR = "colorPrimary";
var DEFAULT_ELEVATION = 4;

global.moduleMerge(common, exports);

export class TabViewItem extends common.TabViewItem {
    public _parent: TabView;

    public _update() {
        if (this._parent) {
            this._parent._updateTabForItem(this);
        }
    }
}

class PagerAdapterClass extends android.support.v4.view.PagerAdapter {
    private owner: TabView;
    private items: Array<definition.TabViewItem>;

    constructor(owner: TabView, items: Array<definition.TabViewItem>) {
        super();

        this.owner = owner;
        this.items = items;

        return global.__native(this);
    }

    getCount() {
        return this.items ? this.items.length : 0;
    }

    getPageTitle(index: number) {
        if (index < 0 || index >= this.items.length) {
            return "";
        }

        return this.items[index].title;
    }

    instantiateItem(container: android.view.ViewGroup, index: number) {
        trace.write("TabView.PagerAdapter.instantiateItem; container: " + container + "; index: " + index, common.traceCategory);

        var item = this.items[index];
        if (item.view.parent !== this.owner) {
            this.owner._addView(item.view);
        }

        if (this[VIEWS_STATES]) {
            trace.write("TabView.PagerAdapter.instantiateItem; restoreHierarchyState: " + item.view, common.traceCategory);
            item.view.android.restoreHierarchyState(this[VIEWS_STATES]);
        }

        container.addView(item.view.android);
        return item.view.android;
    }

    destroyItem(container: android.view.ViewGroup, index: number, _object: any) {
        trace.write("TabView.PagerAdapter.destroyItem; container: " + container + "; index: " + index + "; _object: " + _object, common.traceCategory);
        var item = this.items[index];
        var nativeView = item.view.android;

        if (nativeView.toString() !== _object.toString()) {
            throw new Error("Expected " + nativeView.toString() + " to equal " + _object.toString());
        }

        if (!this[VIEWS_STATES]) {
            this[VIEWS_STATES] = new android.util.SparseArray<android.os.Parcelable>();
        }
        nativeView.saveHierarchyState(this[VIEWS_STATES]);

        container.removeView(nativeView);

        // Note: this.owner._removeView will clear item.view.android.
        // So call this after the native instance is removed form the container. 
        if (item.view.parent === this.owner) {
            this.owner._removeView(item.view);
        }
    }

    isViewFromObject(view: android.view.View, _object: any) {
        return view === _object;
    }

    saveState(): android.os.Parcelable {
        trace.write("TabView.PagerAdapter.saveState", common.traceCategory);

        var owner: TabView = this.owner;
        if (!owner || owner._childrenCount === 0) {
            return null;
        }

        if (!this[VIEWS_STATES]) {
            this[VIEWS_STATES] = new android.util.SparseArray<android.os.Parcelable>();
        }
        var viewStates = this[VIEWS_STATES];
        var childCallback = function (view: view.View): boolean {
            var nativeView: android.view.View = view.android;
            if (nativeView && nativeView.isSaveFromParentEnabled && nativeView.isSaveFromParentEnabled()) {
                nativeView.saveHierarchyState(viewStates);
            }
            return true;
        }
        owner._eachChildView(childCallback);

        var bundle = new android.os.Bundle();
        bundle.putSparseParcelableArray(VIEWS_STATES, viewStates);
        return bundle;
    }

    restoreState(state: android.os.Parcelable, loader: java.lang.ClassLoader) {
        trace.write("TabView.PagerAdapter.restoreState", common.traceCategory);
        var bundle: android.os.Bundle = <android.os.Bundle>state;
        bundle.setClassLoader(loader);
        this[VIEWS_STATES] = bundle.getSparseParcelableArray(VIEWS_STATES);
    }
};

class PageChangedListener extends android.support.v4.view.ViewPager.SimpleOnPageChangeListener {
    private _owner: TabView;
    constructor(owner: TabView) {
        super();
        this._owner = owner;
        return global.__native(this);
    }

    public onPageSelected(position: number) {
        this._owner.selectedIndex = position;
    }
}

function selectedColorPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var tabLayout = (<TabView>data.object)._getAndroidTabView();
    if (tabLayout && data.newValue instanceof color.Color) {
        tabLayout.setSelectedIndicatorColors([data.newValue.android]);
    }
}
(<proxy.PropertyMetadata>common.TabView.selectedColorProperty.metadata).onSetNativeValue = selectedColorPropertyChanged;

export class TabView extends common.TabView {
    private _grid: org.nativescript.widgets.GridLayout;
    private _tabLayout: org.nativescript.widgets.TabLayout;
    private _viewPager: android.support.v4.view.ViewPager;
    private _pagerAdapter: android.support.v4.view.PagerAdapter;
    private _androidViewId: number;

    private _pageChagedListener: PageChangedListener;

    get android(): android.view.View {
        return this._grid;
    }

    public _createUI() {
        trace.write("TabView._createUI(" + this + ");", common.traceCategory);

        this._grid = new org.nativescript.widgets.GridLayout(this._context);
        this._grid.addRow(new org.nativescript.widgets.ItemSpec(1, org.nativescript.widgets.GridUnitType.auto));
        this._grid.addRow(new org.nativescript.widgets.ItemSpec(1, org.nativescript.widgets.GridUnitType.star));

        this._tabLayout = new org.nativescript.widgets.TabLayout(this._context);
        this._grid.addView(this._tabLayout);

        this.setElevation();

        let accentColor = utils.ad.resources.getPalleteColor(ACCENT_COLOR, this._context);
        if (accentColor) {
            this._tabLayout.setSelectedIndicatorColors([accentColor]);
        }

        let primaryColor = utils.ad.resources.getPalleteColor(PRIMARY_COLOR, this._context);
        if (primaryColor) {
            this._tabLayout.setBackgroundColor(primaryColor);
        }

        this._viewPager = new android.support.v4.view.ViewPager(this._context);
        var lp = new org.nativescript.widgets.CommonLayoutParams()
        lp.row = 1;
        this._viewPager.setLayoutParams(lp);
        this._grid.addView(this._viewPager);

        if (!this._androidViewId) {
            this._androidViewId = android.view.View.generateViewId();
        }
        this._grid.setId(this._androidViewId);

        this._pageChagedListener = new PageChangedListener(this);
        (<any>this._viewPager).addOnPageChangeListener(this._pageChagedListener);
    }

    private setElevation() {
        var compat = <any>android.support.v4.view.ViewCompat;
        if (compat.setElevation) {
            let val = DEFAULT_ELEVATION * utils.layout.getDisplayDensity();
            compat.setElevation(this._grid, val);
            compat.setElevation(this._tabLayout, val);
        }
    }

    public _onItemsPropertyChangedSetNativeValue(data: dependencyObservable.PropertyChangeData) {
        trace.write("TabView._onItemsPropertyChangedSetNativeValue(" + data.oldValue + " ---> " + data.newValue + ");", common.traceCategory);

        if (data.oldValue) {
            var oldItems: Array<TabViewItem> = data.oldValue;
            oldItems.forEach((oldItem) => { oldItem._parent = null; });

            this._viewPager.setAdapter(null);
            this._pagerAdapter = null;
            this._tabLayout.setItems(null, null);
        }

        if (data.newValue) {
            var items: Array<TabViewItem> = data.newValue;
            var tabItems = new Array<org.nativescript.widgets.TabItemSpec>();
            items.forEach((item, idx, arr) => {
                if (types.isNullOrUndefined(item.view)) {
                    throw new Error("View of TabViewItem at index " + idx + " is " + item.view);
                }

                item._parent = this;
                tabItems.push(this.createTabItem(item));
            });

            this._pagerAdapter = new PagerAdapterClass(this, data.newValue);
            this._viewPager.setAdapter(this._pagerAdapter);

            this._tabLayout.setItems(tabItems, this._viewPager);
        }

        this._updateSelectedIndexOnItemsPropertyChanged(data.newValue);
    }

    public _updateTabForItem(item: TabViewItem) {
        if (this.items && this.items.length > 0) {
            var index = this.items.indexOf(item);
            if (index >= 0) {
                this._tabLayout.updateItemAt(index, this.createTabItem(item));
            }
        }
    }

    public _onSelectedIndexPropertyChangedSetNativeValue(data: dependencyObservable.PropertyChangeData) {
        trace.write("TabView._onSelectedIndexPropertyChangedSetNativeValue(" + data.oldValue + " ---> " + data.newValue + ");", common.traceCategory);
        super._onSelectedIndexPropertyChangedSetNativeValue(data);

        var index = data.newValue;
        if (!types.isNullOrUndefined(index)) {
            // Select the respective page in the ViewPager
            var viewPagerSelectedIndex = this._viewPager.getCurrentItem();
            if (viewPagerSelectedIndex !== index) {
                trace.write("TabView this._viewPager.setCurrentItem(" + index + ", true);", common.traceCategory);
                this._viewPager.setCurrentItem(index, true);
            }
        }

        var args = { eventName: TabView.selectedIndexChangedEvent, object: this, oldIndex: data.oldValue, newIndex: data.newValue };
        this.notify(args);
    }

    private createTabItem(item: definition.TabViewItem): org.nativescript.widgets.TabItemSpec {
        var result = new org.nativescript.widgets.TabItemSpec();
        result.title = item.title;

        if (item.iconSource) {

            if (item.iconSource.indexOf(utils.RESOURCE_PREFIX) === 0) {
                result.iconId = utils.ad.resources.getDrawableId(item.iconSource.substr(utils.RESOURCE_PREFIX.length));
            }
            else {
                var is = imageSource.fromFileOrResource(item.iconSource);
                if (is) {
                    result.iconDrawable = new android.graphics.drawable.BitmapDrawable(is.android);
                }
            }
        }

        return result;
    }

    public _getAndroidTabView(): org.nativescript.widgets.TabLayout {
        return this._tabLayout;
    }
}
