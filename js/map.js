/**
 * @author fradeve
 */

var map;
var _projObj = {
    wgs84 : new OpenLayers.Projection('EPSG:4326'),
    mercator : new OpenLayers.Projection('EPSG:900913')
};


function init() {
    map = new OpenLayers.Map('map_element', {
        maxExtent : new OpenLayers.Bounds(
            -128 * 156543.0339,
            -128 * 156543.0339,
            128 * 156543.0339,
            128 * 156543.0339),

        maxResolution : 156543.0339,
        units : 'm',

        controls:[
        //allows user pan/zoom ability
        new OpenLayers.Control.Navigation(),
         
        //displays the pan/zoom tools
        new OpenLayers.Control.PanZoom(),
         
        //displays a layer switcher
        new OpenLayers.Control.LayerSwitcher()],

        //displays nice attribution
        //new OpenLayers.Control.Attribution(),

        projection : _projObj.mercator,
        displayProjection : _projObj.wgs84
    });

    var osm_layer = new OpenLayers.Layer.OSM('OSM Layer', null, {
            transitionEffect: "resize"
        });

    map.addLayers([osm_layer]);
    var gargano = new OpenLayers.Bounds(15.66,41.60,16.14,41.91);
    map.zoomToExtent(gargano.transform(_projObj.wgs84, _projObj.mercator))
};


function onPopupClose(evt) {
    selectFeatureCtrl.unselect(selectedFeature);
};


function onSelect(feature) {
    selectedFeature = feature
    loadScr(feature.attributes.scrid)
    popup = new OpenLayers.Popup.FramedCloud("popup", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(200, 200), "<div id='content'> <img src='images/loading.gif'></img> </div>", null, true, onPopupClose);
    feature.popup = popup;
    map.addPopup(popup);
};


function onUnselect(feature) {
    map.removePopup(feature.popup);
    feature.popup.destroy();
    feature.popup = null;
};


function loadScr(scr) {
    $.ajax({
        type : 'POST',
        url : 'wsgi/golden_retriever.py',
        data : {
                scr : scr
               }
        }).done(function(html) {
            console.log(html);
            $("#content img").remove();
            $("#content").append(html);
            popup.setSize(new OpenLayers.Size(300, 300))
        })
};


function addSelectedLayer(USType) {
    // before adding new layer, check if there are other layers loaded,
    // and destroy them; since we've one layer loaded a time, we don't need
    // to check layer name (since layer[0] is always OSM WMS)
    // interestin option for name checking
    // var regExp = /Simple/g
    // var testString = "Simple Geometry"
    // f(regExp.test(testString)) {alert("c'è!")}
    if (map.layers.length > 1) {
        map.layers[1].destroy()
    };

    uses_layer = new OpenLayers.Layer.Vector("US Layer", {
        strategies : [new OpenLayers.Strategy.Fixed()],
        projection : _projObj.wgs84,
        visibility : true,
        protocol : new OpenLayers.Protocol.WFS({
            version : '1.0.0',
            // TODO: try WFS 1.1.0 and OL reprojection
            url : 'http://46.105.19.68/cgi-bin/mapserv?map=/home/fradeve/public_html/ark-oia/wfs.map&service=WFS',
            featureType : USType
        })
        // TODO: instead of dividing USes on different layers, try to keep them
        // on the same layer, and use filters to switch
    });

    map.addLayers([uses_layer])

    // zoom to layer extent function after complete layer loading
    uses_layer.events.register('loadend', uses_layer, function(evt) {
        map.zoomToExtent(uses_layer.getDataExtent())
    })

    // define the behaviour of geometries in layer when selected
    var selectFeatureCtrl = new OpenLayers.Control.SelectFeature(
        [uses_layer],
        {
            multiple : false,
            toggle : true,
            onSelect : onSelect,
            onUnselect : onUnselect
        });

    // define the behaviour of geometries when hover
    var highlightCtrl = new OpenLayers.Control.SelectFeature(
        uses_layer,
        {
            hover: true,
            highlightOnly: true,
            renderIntent: "temporary"
        });

    map.addControl(highlightCtrl);
    map.addControl(selectFeatureCtrl);

    highlightCtrl.activate();
    selectFeatureCtrl.activate();
}
