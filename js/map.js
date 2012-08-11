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
}

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

    var uses_layer = new OpenLayers.Layer.Vector("US Layer", {
        strategies : [new OpenLayers.Strategy.Fixed()],
        projection : _projObj.wgs84,
        visibility : true,
        protocol : new OpenLayers.Protocol.WFS({
            version : '1.0.0',
            url : 'http://46.105.19.68/cgi-bin/mapserv?map=/home/fradeve/public_html/ark-oia/wfs.map&service=WFS',
            featureType : USType
        })
        // TODO: instead of dividing USes on different layers, try to keep them
        // on the same layer, and use filters to switch
    });

    // define the behaviour of geometries in layer when selected
    var select_feature_control = new OpenLayers.Control.SelectFeature(
        uses_layer,
        {
            multiple : false,
            toggle : true
        });

    map.addLayers([uses_layer])

    map.addControl(select_feature_control);
    select_feature_control.activate();
}
