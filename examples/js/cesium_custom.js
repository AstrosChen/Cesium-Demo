function convertCanvasToImage(canvas) {
    //新Image对象，可以理解为DOM
    var image = new Image();
    // canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
    // 指定格式 PNG
    image.src = canvas.toDataURL("image/png");
    return image.src;
}

function setCanvas(color) {
    var canvas=document.getElementById('polylineMatel');
    var height = canvas.offsetHeight;
    var width = canvas.offsetWidth;
    var ctx=canvas.getContext('2d');
    var grd=ctx.createLinearGradient(0,0,width,0);
    grd.addColorStop(1,'rgba('+color[0]+','+color[1]+','+color[2]+',1)');
    // grd.addColorStop(0.5,'rgba('+color[0]+','+color[1]+','+color[2]+','+color[3]+')');
    grd.addColorStop(0,'rgba('+color[0]+','+color[1]+','+color[2]+',0)');
    ctx.fillStyle=grd;
    ctx.fillRect(0,0,width,width);
    return canvas;
}


function PolylineTrailLinkMaterialProperty(color, duration) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    this.color = color;
    this.duration = duration;
    this._time = (new Date()).getTime();
}
Cesium.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
    isConstant: {
        get: function () {
            return false;
        }
    },
    definitionChanged: {
        get: function () {
            return this._definitionChanged;
        }
    },
    color: Cesium.createPropertyDescriptor('color')
});
PolylineTrailLinkMaterialProperty.prototype.getType = function (time) {
    return 'PolylineTrailLink';
};
PolylineTrailLinkMaterialProperty.prototype.getValue = function (time, result) {
    if (!Cesium.defined(result)) {
        result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
    result.image = Cesium.Material.PolylineTrailLinkImage;
    result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
    return result;
};
PolylineTrailLinkMaterialProperty.prototype.equals = function (other) {
    return this === other || (other instanceof PolylineTrailLinkMaterialProperty && Property.equals(this._color, other._color))
};
Cesium.PolylineTrailLinkMaterialProperty = PolylineTrailLinkMaterialProperty;
Cesium.Material.PolylineTrailLinkType = 'PolylineTrailLink';
// Cesium.Material.PolylineTrailLinkImage = "images/colors1.png";
Cesium.Material.PolylineTrailLinkImage = convertCanvasToImage(setCanvas([0, 0, 0]));
Cesium.Material.PolylineTrailLinkSource = "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                                                      {\n\
                                                           czm_material material = czm_getDefaultMaterial(materialInput);\n\
                                                           vec2 st = materialInput.st;\n\
                                                           vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
                                                           material.alpha = colorImage.a * color.a;\n\
                                                           material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                                                           return material;\n\
                                                       }";
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrailLinkType, {
    fabric: {
        type: Cesium.Material.PolylineTrailLinkType,
        uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
            image: Cesium.Material.PolylineTrailLinkImage,
            time: 0
        },
        source: Cesium.Material.PolylineTrailLinkSource
    },
    translucent: function (material) {
        return true;
    }
});