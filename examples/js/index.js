var viewer;
var roadArr = {
    'highway': {color: [0,255,181, 1]}, //高速
    'mainroad': {color: [255,255,0, 1]}, //主干道
    'railway': {color: [255, 0, 0, 1]},//铁路
    'secondroad': {color: [255,0,43, 1]}, //街道
    'subway': {color: [175,0,255, 1]}  //地铁
};
var lng = -73.978, lat = 40.765;
//尾迹线材质
var PolylineTrailLinkMaterialProperty = function (color, duration) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    this.color = color;
    this.duration = duration;
    this._time = (new Date()).getTime() - Math.random(1) * 5000;
};

var Tick = function (fn) {
    const _this = this;
    _this.isRun = true;
    _this.limit = 15;
    _this.up = 0;
    _this.second = 0;
    _this.interval = null;
    _this.init = function () {
        clearInterval(_this.interval);
        _this.interval = setInterval(_this.cycle, 1000);
    };
    _this.debug = function () {
        console.log("时间过去"+_this.second+"秒");
    };
    _this.animation = fn || function () {};
    _this.begin = function () {
        _this.animation();
    };

    _this.cycle = function () {
        _this.up++;
        _this.second++;
        // _this.debug();
        if(_this.isRun){
            if(_this.up > _this.limit){
                _this.up = 0;
                _this.begin();
            }
        }else{
            return;
        }
    };
    _this.init();
};

var mapImgService = '../assets/tiles/tiles/{z}/{x}/{y}.png';
$(function () {
    init(function () {
        //初始化后执行

        //加载建筑
        loadtiles();

        //加载边界线
        loadborder({url: '../assets/json/nyc_island_border.json', name: 'nyc_border', color: [3, 236, 196, 0.8]});

        //按钮事件绑定
        btnEvent();

        //几何
        // building({lng: 130, lat: 35, height: 100});

        //后期渲染
        // postProcess();

        //尾迹线
        // newPolyLine();
    });
});

/**
 * 初始化
 * @param fn
 */
function init(fn) {
    viewer = new Cesium.Viewer('cesiumContainer', {	//cesiumContainer为容器id
        cesiumLogo: false,  //是否显示cesium商标
        // baseLayerPicker: false, //是否显示图层服务选择器
        // homeButton: false,  //home视角按钮
        // infoBox: false, //版本及插件信息
        // timeline: false,    //时间线
        // animation: false,   //动画
        // navigationHelpButton: false,    //导航帮助按钮
        // navigationInstructionsInitiallyVisible: false,
        // mapProjection: new Cesium.WebMercatorProjection(),   //在二维和Columbus视图模式下所使用的地图投影
        // selectionIndicator: false,  //选择指示符
        // skyBox: false,  //天空盒子
        // navigation: false,  //导航
        orderIndependentTranslucency: true, //如果此项设置为true，并且使用设备支持，将使用与顺序无关的半透明
        imageryProvider: Cesium.createOpenStreetMapImageryProvider({
            url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/'
        })
    });

    //地球开启深度测试
    viewer.scene.globe.depthTestAgainstTerrain = false;
    //去除logo
    viewer._cesiumWidget._creditContainer.style.display = "none";


    //更换瓦片图
    /*viewer.imageryLayers.remove(viewer.imageryLayers.get(0));
    var urlTemplateImageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: mapImgService, //瓦片图片地址
        tileHeight: 256,    //图片高的像素
        tileWidth: 256,     //图片低的像素
        tilingScheme: new Cesium.WebMercatorTilingScheme(), //坐标系 这里建议使用墨卡托投影坐标系
    });
    viewer.imageryLayers.addImageryProvider(urlTemplateImageryProvider);
    viewer.scene.skyAtmosphere = new Cesium.SkyAtmosphere();*/
    // requestWaterMask: true

    viewer.clock.onTick.addEventListener(function () {
        setMinCamera()
    });

    var setMinCamera = function () {
        if (viewer.camera.height < 0) {
            viewer.camera.height = 1;
        }
    };

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
        return this === other ||
            (other instanceof PolylineTrailLinkMaterialProperty &&
                Cesium.Property.equals(this._color, other._color))
    };
    Cesium.PolylineTrailLinkMaterialProperty = PolylineTrailLinkMaterialProperty;
    Cesium.Material.PolylineTrailLinkType = 'PolylineTrailLink';
    // Cesium.Material.PolylineTrailLinkImage = "images/colors1.png";
    Cesium.Material.PolylineTrailLinkImage = convertCanvasToImage(setCanvas([255, 255, 255]));
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
                color: new Cesium.Color(1.0, 1.0, 1.0, 1),
                image: Cesium.Material.PolylineTrailLinkImage,
                time: 0
            },
            source: Cesium.Material.PolylineTrailLinkSource
        },
        translucent: function (material) {
            return true;
        }
    });

    //回调
    if (fn) {
        fn();
    }
}

/**
 * 从 canvas 提取图片 image
 * @param canvas
 * @returns {string}
 */
function convertCanvasToImage(canvas) {
    //新Image对象，可以理解为DOM
    var image = new Image();
    // canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
    // 指定格式 PNG
    image.src = canvas.toDataURL("image/png");
    return image.src;
}

/**
 * 设置一个左右渐变的画布
 * @param color
 * @returns {HTMLElement}
 */
function setCanvas(color) {
    var canvas = document.getElementById('polylineMatel');
    var height = canvas.offsetHeight;
    var width = canvas.offsetWidth;
    var ctx = canvas.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, width, 0);
    grd.addColorStop(1, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)');
    // grd.addColorStop(0.5,'rgba('+color[0]+','+color[1]+','+color[2]+','+color[3]+')');
    grd.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, width);
    return canvas;
}

/**
 * 事件按钮绑定
 */
function btnEvent() {
    $('.btngroup').children().click(function () {
        switch ($(this).attr('class')) {
            //卫星
            case 'satellite':
                satellite({lat: 36, lng: 130, height: 40000});
                break;
            //环球线
            case 'olline':
                newPolyLine();
                break;
            //雷达
            case 'radar':
                setRandar({lat: getNYCPosition()[1], lng: getNYCPosition()[0], height: 0});
                break;
            //点
            case 'point':

                break;
            //相机漫游
            case 'moveCar':
                var index = 0;
                var tick = new Tick(function () {
                    if(index>=area.length){
                        index = 0;
                    }
                    viewer.camera.flyTo({
                        destination : Cesium.Cartesian3.fromDegrees(area[index][0], area[index][1], 5000.0),
                        orientation: {
                            heading : Cesium.Math.toRadians(-15.0),
                            pitch : -Cesium.Math.PI_OVER_FOUR,
                            roll : 0.0
                        },
                        duration: 12,
                        // flyOverLongitude: Cesium.Math.toRadians(60.0)
                    });
                    index++;
                });
                break;
            //飞机
            case 'plan':
                airplan();
                break;
            //道路
            case 'way':
                var show;
                if ($(this).is(':checked')) {
                    show = true;
                } else {
                    show = false;
                }
                //道路类型
                var name = $(this).attr('id');
                //获取数据地址
                var url = '../assets/json/way/nyc_' + name + '.json';
                roadArr[name].initFlag = roadArr[name].initFlag ? true : false;
                if (roadArr[name].initFlag) {
                    //已初始化
                    if (show) {
                        roadArr[name].obj.show = true;
                    } else {
                        roadArr[name].obj.show = false;
                    }
                } else {
                    //未初始化
                    loadroad({name: name, url: url, color: roadArr[name].color});
                }
                break;
            case 'car':
                createMoveCar();
                break;
            default:
                break;
        }
    });
}

function createMoveCar(){

}

/**
 * 返回一个在纽约island的随机经纬
 */
function getNYCPosition() {
    var lng = -73.978, lat = 40.765;
    lng += Math.random() * (Math.random(1) > 0.5 ? 1 : -1);
    lat += Math.random() * (Math.random(1) > 0.5 ? 1 : -1);
    return [lng, lat];
}


/**
 * 加载道路
 * @param option
 */
function loadroad(option) {

    var opt = {
        fn: option.fn,
        url: option.url,
        name: option.name,
        width: option.width || 3,
        color: option.color || '',
        height: option.height || 1
    };
    var material = new Cesium.PolylineTrailLinkMaterialProperty(new Cesium.Color(opt.color[0], opt.color[1], opt.color[2], opt.color[3]), 3000);

    var jsonSource = new Cesium.GeoJsonDataSource(opt.name);
    var promiseroute = jsonSource.load(opt.url);
    promiseroute.then(function (dataSource) {
        var road = viewer.dataSources.add(dataSource);
        var Routes = dataSource.entities.values;

        for (var j = 0; j < Routes.length; j++) {
            var line = Routes[j];
            line.polyline.material = material;
            line.polyline.width = opt.width;
            line.polyline.height = opt.height;
        }

        roadArr[opt.name].obj = dataSource;
        roadArr[opt.name].initFlag = true;

    }).otherwise(function (error) {
        console.log(error);
    });

}

/**
 * 漫游飞机
 */
function airplan() {
    var hpRoll = new Cesium.HeadingPitchRoll();
    var hpRange = new Cesium.HeadingPitchRange();
    var speed = 10;
    var deltaRadians = Cesium.Math.toRadians(3.0);

    var position = Cesium.Cartesian3.fromDegrees(-73.99094582, 40.75910568, 500.0);
    var speedVector = new Cesium.Cartesian3();
    var fixedFrameTransform = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west');

    var planePrimitive = viewer.scene.primitives.add(Cesium.Model.fromGltf({
        url: '../assets/models/low_poly_apache_gunship/scene.gltf',
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrameTransform),
        minimumPixelSize: 10000000,
        maximumScale: 10,
        color: Cesium.Color.WHITE
    }));

    planePrimitive.readyPromise.then(function (model) {
        // Play and loop all animations at half-speed
        model.activeAnimations.addAll({
            multiplier: 1,
            loop: Cesium.ModelAnimationLoop.REPEAT
        });
        model.color = new Cesium.Color(1, 1, 1, 0.5);
        model.lightColor = new Cesium.Color(1, 1, 1, 0.5);


        planePrimitive.sphericalHarmonicCoefficients = undefined;
        planePrimitive.specularEnvironmentMaps = undefined;
        planePrimitive.luminanceAtZenith = 4;
    });
}

/**
 * 加载边界
 */
function loadborder(option) {
    var opt = {
        fn: option.fn,
        url: option.url,
        name: option.name || 'border',
        width: option.width || 3,
        color: option.color || [100, 149, 237, 1],
        fillcolor: option.fillcolor || [100, 149, 237, 0],
        // id: option.id || '',
    };
    var index;
    $.get(opt.url, function (result) {
        var jsonSource = new Cesium.GeoJsonDataSource(opt.name);
        var data = jsonSource.load(result, {
            stroke: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.color[3]),
            fill: new Cesium.Color(opt.fillcolor[0] / 255, opt.fillcolor[1] / 255, opt.fillcolor[2] / 255, opt.fillcolor[3]),
            strokeWidth: opt.width
        });
        viewer.dataSources.add(data);
        index = viewer.dataSources.indexOf(jsonSource);

        if (opt.fn) {
            opt.fn();
        }
    });

}

/**
 * 加载3dtiles
 */
function loadtiles() {
    /*var tileset = new Cesium.Cesium3DTileset({
        url: '../assets/3Dtiles/NewYork3/NewYork/tileset.json',
        maximumScreenSpaceError: 2,
        maximumNumberOfLoadedTiles: 1000,
        // skipLevels: 0,
        // loadSiblings: true,

        dynamicScreenSpaceError: true,
        dynamicScreenSpaceErrorDensity: 0.00278,
        dynamicScreenSpaceErrorFactor: 4.0,
        dynamicScreenSpaceErrorHeightFalloff: 0.25,

        skipLevelOfDetail: true,
        baseScreenSpaceError: 1024,
        skipScreenSpaceErrorFactor: 16,
        skipLevels: 1,
        immediatelyLoadDesiredLevelOfDetail: false,
        loadSiblings: false,
        cullWithChildrenBounds: true,

        shadows: Cesium.ShadowMode.DISABLED,    //不投射阴影也不接收阴影

    });
    city.readyPromise.then(function (tileset) {
        // Position tileset
        var boundingSphere = tileset.boundingSphere;
        var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        var surfacePosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offsetPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var translation = Cesium.Cartesian3.subtract(offsetPosition, surfacePosition, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        // viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(cartographic.longitude, cartographic.latitude, 5000)});
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.714, 5000), complete: function () {
                //飞机
            }
        });

        //修改颜色
        var color = new Cesium.Cesium3DTileStyle({
            color: 'rgba(255, 255, 255, 0.3)',
        });
        city.style = color;

        //亮度
        city.sphericalHarmonicCoefficients = undefined;
        city.specularEnvironmentMaps = undefined;
        city.luminanceAtZenith = 4;
    });*/
    var tileset = new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(3839)
    });
    var city = viewer.scene.primitives.add(tileset);

    var heightOffset = 0;
    city.readyPromise.then(function (tileset) {
        // Position tileset
        var boundingSphere = tileset.boundingSphere;
        var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        var surfacePosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offsetPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
        var translation = Cesium.Cartesian3.subtract(offsetPosition, surfacePosition, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);


        //修改颜色
        var color = new Cesium.Cesium3DTileStyle({
            color: 'rgba(255, 255, 255, 0.3)',
        });
        city.style = color;

        //亮度
        city.sphericalHarmonicCoefficients = undefined;
        city.specularEnvironmentMaps = undefined;
        city.luminanceAtZenith = 4;
    });

}


/**
 * 雷达
 */
function setRandar() {
    var cartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(lng += 0.01), Cesium.Math.toRadians(lat), 10);
    var scanColor = new Cesium.Color(1.0, 0.0, 0.0, 1);

    addCircleScanPostStage(viewer, cartographicCenter, 580, scanColor, 4000);
}

/**
 * 创建后期渲染雷达
 * @param viewer
 * @param cartographicCenter
 * @param maxRadius
 * @param scanColor
 * @param duration
 * @returns {*}
 */
function addCircleScanPostStage(viewer, cartographicCenter, maxRadius, scanColor, duration) {
    var scanSegmentShader =
        "                        uniform sampler2D colorTexture;\n" +
        "                        uniform sampler2D depthTexture;\n" +
        "                        varying vec2 v_textureCoordinates;\n" +
        "                        uniform vec4 u_scanCenterEC;\n" +
        "                        uniform vec3 u_scanPlaneNormalEC;\n" +
        "                        uniform float u_radius;\n" +
        "                        uniform vec4 u_scanColor;\n" +
        "                        \n" +
        "                        vec4 toEye(in vec2 uv,in float depth)\n" +
        "                        {\n" +
        "                                    vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n" +
        "                                    vec4 posIncamera = czm_inverseProjection * vec4(xy,depth,1.0);\n" +
        "                                    posIncamera = posIncamera/posIncamera.w;\n" +
        "                                    return posIncamera;\n" +
        "                        }\n" +
        "                        \n" +
        "                        vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point)\n" +
        "                        {\n" +
        "                                    vec3 v01 = point - planeOrigin;\n" +
        "                                    float d = dot(planeNormal,v01);\n" +
        "                                    return (point-planeNormal * d);\n" +
        "                        }\n" +
        "                        float getDepth(in vec4 depth)\n" +
        "                        {\n" +
        "                        float z_window = czm_unpackDepth(depth);\n" +
        "                        z_window = czm_reverseLogDepth(z_window);\n" +
        "                       float n_range = czm_depthRange.near;\n" +
        "                        float f_range = czm_depthRange.far;\n" +
        "                     return (2.0 * z_window - n_range - f_range)/(f_range-n_range);\n" +
        "         }\n" +
        "         void main()\n" +
        "          {\n" +
        "                       gl_FragColor = texture2D(colorTexture,v_textureCoordinates);\n" +
        "                   float depth = getDepth(texture2D(depthTexture,v_textureCoordinates));\n" +
        "                   vec4 viewPos = toEye(v_textureCoordinates,depth);\n" +
        "                   vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz,u_scanCenterEC.xyz,viewPos.xyz);\n" +
        "                   float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n" +
        "                   if(dis<u_radius)\n" +
        "                   {\n" +
        "                       float f = 1.0-abs(u_radius - dis )/ u_radius;\n" +
        "                           f = pow(f,4.0);\n" +
        "                          gl_FragColor = mix(gl_FragColor,u_scanColor,f);\n" +
        "                 }\n" +
        "       }";
    var _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
    var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1);

    var _CartograhpicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500);
    var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartograhpicCenter1);
    var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1);

    var _time = (new Date()).getTime();

    var _scratchCartesian4Center = new Cesium.Cartesian4();
    var _scratchCartesian4Center1 = new Cesium.Cartesian4();
    var _scratchCartesian3Normal = new Cesium.Cartesian3();


    var ScanPostStage = new Cesium.PostProcessStage({
        fragmentShader: scanSegmentShader,
        uniforms: {
            u_scanCenterEC: function () {
                var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                return temp;
            },
            u_scanPlaneNormalEC: function () {
                var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                var temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);

                _scratchCartesian3Normal.x = temp1.x - temp.x;
                _scratchCartesian3Normal.y = temp1.y - temp.y;
                _scratchCartesian3Normal.z = temp1.z - temp.z;

                Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);

                return _scratchCartesian3Normal;
            },
            u_radius: function () {
                return maxRadius * (((new Date()).getTime() - _time) % duration) / duration;
            },
            u_scanColor: scanColor
        }
    });

    viewer.scene.postProcessStages.add(ScanPostStage);
    return ScanPostStage;
}

/**
 * 卫星
 * @param option
 */
function satellite(option) {
    var lng = option.lng;
    var lat = option.lat;
    // 1 雷达位置计算
    // 1.1 雷达的高度
    var length = option.height || 400000.0;
    // 1.2 地面位置(垂直地面)
    var positionOnEllipsoid = Cesium.Cartesian3.fromDegrees(lng, lat);
    // 1.3 中心位置
    var centerOnEllipsoid = Cesium.Cartesian3.fromDegrees(lng, lat, length * 0.5);
    // 1.4 顶部位置(卫星位置)
    var topOnEllipsoid = Cesium.Cartesian3.fromDegrees(lng, lat, length);
    // 1.5 矩阵计算
    var modelMatrix = Cesium.Matrix4.multiplyByTranslation(
        Cesium.Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid),
        new Cesium.Cartesian3(0.0, 0.0, length * 0.5), new Cesium.Matrix4()
    );

    // 2 相机飞入特定位置
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(centerOnEllipsoid, length));

    // 3 创建卫星
    /*var imageUri = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjgzLjIzIiBoZWlnaHQ9IjIwNi42NiIgZmlsbC1ydWxlPSJldmVub2RkIiB2aWV3Qm94PSIwIDAgODUwMCAxMTAwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiA8ZGVmcz4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImIiPgogICA8c3RvcCBvZmZzZXQ9IjAiLz4KICAgPHN0b3Agc3RvcC1vcGFjaXR5PSIwIiBvZmZzZXQ9IjEiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxsaW5lYXJHcmFkaWVudCBpZD0iaCIgeDE9IjQ2NjEiIHgyPSI0MzcxLjkiIHkxPSIyMTYxLjIiIHkyPSIyMzk1LjYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iIzQ1NDU4NSIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNiYWJhZmQiIG9mZnNldD0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJpIiB4MT0iNDY2OS45IiB4Mj0iNDU0My42IiB5MT0iMjI5Ny4xIiB5Mj0iMjU1Ni4xIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiMzYTNhNjMiIG9mZnNldD0iMCIvPgogICA8c3RvcCBzdG9wLWNvbG9yPSIjYmFiYWZkIiBvZmZzZXQ9IjEiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxsaW5lYXJHcmFkaWVudCBpZD0iayIgeDE9IjU0MDguMiIgeDI9IjU0ODIuNiIgeTE9IjM1ODkuNSIgeTI9IjM5NjAuNSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguMDU0OTA3IC45MzYwMiAuOTM2OTEgLjA3MjA4MyAxNzcuNDMgLTI3MTkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNkOWQ5ZDkiIHN0b3Atb3BhY2l0eT0iMCIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmYiIG9mZnNldD0iLjYyOTYzIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNlOWU5ZTkiIHN0b3Atb3BhY2l0eT0iMCIgb2Zmc2V0PSIxIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImwiIHgxPSI1MzE5LjMiIHgyPSI1MzcxLjIiIHkxPSIzNTA4LjEiIHkyPSIzNTY5LjgiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLjE1Mzg2IC45NDkxOCAxLjAyNDMgLjI3MjUzIC02NzIuMzcgLTM1MjUuMSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmYiIG9mZnNldD0iLjUiLz4KICAgPHN0b3Agc3RvcC1jb2xvcj0iIzBkMDAwMCIgb2Zmc2V0PSIxIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImEiPgogICA8c3RvcCBvZmZzZXQ9IjAiLz4KICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ExYTFhMSIgb2Zmc2V0PSIuNSIvPgogICA8c3RvcCBvZmZzZXQ9IjEiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxsaW5lYXJHcmFkaWVudCBpZD0iZiIgeDE9IjQ2NTguOSIgeDI9IjQ0OTcuOCIgeTE9IjIyODguNSIgeTI9IjI2MzMuNyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICA8c3RvcCBzdG9wLWNvbG9yPSIjNDU0NTg1IiBvZmZzZXQ9IjAiLz4KICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZiIgb2Zmc2V0PSIxIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSI1MDY0LjEiIHgyPSI0NzU5LjYiIHkxPSIyMzE4LjkiIHkyPSIyNjA1LjkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iIzUxNTE5YyIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmM2YzZjkiIG9mZnNldD0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJqIiB4MT0iNDY3My4yIiB4Mj0iNDc4Ni40IiB5MT0iMTYyNy4xIiB5Mj0iMTg2NS42IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgIDxzdG9wIG9mZnNldD0iMCIvPgogICA8c3RvcCBzdG9wLWNvbG9yPSIjZmZmYmZiIiBvZmZzZXQ9Ii4yNDA3NCIvPgogICA8c3RvcCBvZmZzZXQ9IjEiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxsaW5lYXJHcmFkaWVudCBpZD0ibSIgeDI9IjAiIHkxPSI1MjUxLjciIHkyPSI0NTYwLjkiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLjcwNjMyIC43MDc4OSAuNzA3ODkgLS43MDYzMiAtMjQ3Mi41IDMwOTIuMykiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4bGluazpocmVmPSIjYiIvPgogIDxsaW5lYXJHcmFkaWVudCBpZD0ibiIgeDE9IjQxNTcuNSIgeDI9IjQwNzkuNiIgeTE9IjE3ODYuOCIgeTI9IjIxNDQuNCIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCguOTM5NjIgLjY3ODk3IC0uNjc4OTcgLjkzOTYyIDIyODQuNyAtMjk3NS4yKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHhsaW5rOmhyZWY9IiNiIi8+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJvIiB4MT0iNDg1MS43IiB4Mj0iNDg4Ni4yIiB5MT0iMTgzMS4zIiB5Mj0iMTgwMC44IiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC4wNzc0NjcgMS4xNTA2IC0xLjE2NjEgLS4yNzA1OCA2MjQyLjIgLTMyMzIuNCkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4bGluazpocmVmPSIjYSIvPgogIDxsaW5lYXJHcmFkaWVudCBpZD0icCIgeDE9IjQ4NDUuNSIgeDI9IjQ4NzUuNCIgeTE9IjE4MjkuNSIgeTI9IjE4MDAuMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgtLjAwNDg0NTUgLS42MTExOCAtLjcwMjQ0IC4wMDU1NjkxIDU5MjQuNSA0NjE5LjkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeGxpbms6aHJlZj0iI2EiLz4KICA8bGluZWFyR3JhZGllbnQgaWQ9InEiIHgxPSI0ODQ1LjUiIHgyPSI0ODc1LjQiIHkxPSIxODI5LjUiIHkyPSIxODAwLjEiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLjg0MjIxIC0uMDU4NTA0IC4wNjcyMzkgLjk2Nzk3IDYwMy42NCAzNjkuNTkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeGxpbms6aHJlZj0iI2EiLz4KICA8cmFkaWFsR3JhZGllbnQgaWQ9ImMiIGN4PSI1MTAxLjQiIGN5PSIzNzIwIiByPSIzNTMuODIiIGZ4PSI1MDY4LjIiIGZ5PSIzNjUwLjEiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLjI2MjYxIDIuMTE0IDEuNTkzNCAuMDgwODQ2IC0zMzMyLjUgLTg3NjEuNSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iIzA1MDEwMSIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiNmZmYiIG9mZnNldD0iMSIvPgogIDwvcmFkaWFsR3JhZGllbnQ+CiAgPHJhZGlhbEdyYWRpZW50IGlkPSJkIiBjeD0iNTA2My4xIiBjeT0iMzc0Ny41IiByPSIzMjkuMzYiIGZ4PSI1MTMyLjciIGZ5PSIzNjU0LjkiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLS4wNzM5MDMgLS42NzM2NSAtLjU5NTI5IC4wMTE4NTMgNjUxMi41IDU3NDkuOSkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iI2M2YzZjNiIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiMxYTFhMWEiIG9mZnNldD0iMSIvPgogIDwvcmFkaWFsR3JhZGllbnQ+CiAgPHJhZGlhbEdyYWRpZW50IGlkPSJlIiBjeD0iMzk3Ny42IiBjeT0iMjQxNS40IiByPSIxMTkuMTUiIGZ4PSIzOTY0LjQiIGZ5PSIyNDYxLjciIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLTEuMjczMSAuNDA1ODcgLS4zNzA3MSAtMS4xNjI4IDEwNTU4IDMwMDAuNCkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgPHN0b3Agc3RvcC1jb2xvcj0iI2ZmZiIgb2Zmc2V0PSIwIi8+CiAgIDxzdG9wIHN0b3AtY29sb3I9IiMwNDAwMDAiIG9mZnNldD0iMSIvPgogIDwvcmFkaWFsR3JhZGllbnQ+CiA8L2RlZnM+CiA8ZyB0cmFuc2Zvcm09Im1hdHJpeCg3LjYwNzQgLS4yNTYwNCAuMjU2MDQgNy42MDc0IC0zMzM2MSAtNjY4NC44KSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCguODgzMzMgLjExMDYxIC0uMTY4MzUgLjg3OTQ5IDgyNy4xNCAtMTAxNSkiPgogICA8cGF0aCBkPSJtNDYxMS4yIDI1MDkuOCAyNzYuNTktMTYzLjM0LTQwMi45Mi0yMjAuOTMtMjYzLjA5IDExMS45NyAzODkuNDIgMjcyLjI5eiIgZmlsbD0iIzVlODg5ZCIvPgogICA8cGF0aCBkPSJtNDY0Ny41IDIyMzMuOS0xNjAuNDQtODkuNDM0LTkxLjM4MSA0MS4xMjggMTU1LjQ1IDEwMS4zNSA5Ni4zNy01My4wNDV6bS0zODEuNjMgOS4wMjYgMTYwLjc1IDExMi44NiAxMDYuNDctNTguODI2LTE1Ny4yNC0xMDIuNjYtMTA5Ljk3IDQ4LjYzMXptMjg0LjQgNjUuMTUzLTEwNS4xMiA1OS40MDEgMTY3LjEgMTE2LjA2IDExMC45My02My4yNTQtMTcyLjkxLTExMi4yMXptMTg5LjU5IDEwMS41OSAxMDkuNDktNjMuMjg5LTE4NC4zNS0xMDIuODYtOTYuODY5IDUzLjg1NCAxNzEuNzMgMTEyLjI5eiIgZmlsbD0idXJsKCNoKSIgZmlsbC1ydWxlPSJub256ZXJvIi8+CiAgPC9nPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KC41NzcyNSAuMjYwNDcgLS41NjE4NSAuODY4MDUgMjkyNC4zIC0xOTY3LjQpIj4KICAgPHBhdGggZD0ibTQ2MTEuMiAyNTA5LjggMjc2LjU5LTE2My4zNC0zNzUuMTktMjE5LjY2Yy05LjQwNjYtNC4zODI5LTE1Ljk4Ni01Ljc0LTI4Ljk1LTMuMTUyOGwtMjQ2LjM4IDEwNy4xMmMtNi4zMjY5IDQuMjM1OC02LjI4MiA5LjcyOTItMi4yMjM4IDE2LjAxNWwzNzYuMTUgMjYzLjAxeiIgZmlsbD0iIzNjNjg3ZSIvPgogICA8cGF0aCBkPSJtNDY1MS4zIDIyMzEuOC0xNTMuMzgtOTIuNjc5LTEwMi4xOSA0Ni41NDYgMTU1LjQ1IDEwMS4zNSAxMDAuMTItNTUuMjJ6bS0zODUuMzkgMTEuMjAxIDE2MC43NSAxMTIuODYgMTA2LjQ3LTU4LjgyNi0xNTcuMjQtMTAyLjY2LTEwOS45NyA0OC42MzF6bTI4NC40IDY1LjE1My0xMDUuMTIgNTkuNDAxIDE2Ny4xIDExNi4wNiAxMTAuOTMtNjMuMjU0LTE3Mi45MS0xMTIuMjF6bTE4OS41OSAxMDEuNTkgMTA5LjQ5LTYzLjI4OS0xODAuNi0xMDUuMDQtMTAwLjYyIDU2LjAyOSAxNzEuNzMgMTEyLjI5eiIgZmlsbD0idXJsKCNpKSIgZmlsbC1ydWxlPSJub256ZXJvIi8+CiAgPC9nPgogIDxwYXRoIGQ9Im00NjA0LjggMTY0Ny44Yy0xNi42MjYtMTUuNzU1LTEuMDcyLTI4LjE5IDEzLjc4Ny0xMy40OGwyOC4xNjQgMjAuOTZjMTcuOTM5IDEwLjgwMi01Ljg0OTUgMjguODE0LTE3LjkwNCAyMy4zMTlsLTI2LjQ3OS0yOS4wMzQgMi40MzIxLTEuNzY1eiIgZmlsbD0idXJsKCNwKSIgZmlsbC1ydWxlPSJub256ZXJvIi8+CiAgPHBhdGggZD0ibTQ2NDAuNSAxOTYwLjVjNTguMjkxLTM0LjY4MiA1MC40MTktMTYwLjkxLTUuODEyMi0yMTMuNzktNDMuOTg2LTQxLjcyLTEwMi4xOC01My4zNy0xNDIuODItMzAuNzA3bDMzNy4xOC0xNDkuM2M0NC42NTQtMjMuNTQyIDExNy42Mi0zMS4yNTIgMTY2LjgxIDIxLjE2NCAzMi4wNTYgMzQuMTU4IDQ3LjM2OCAxMjYuMTYtMTkuNjI5IDE3MC4xNGwtMzM1Ljc0IDIwMi41eiIgZmlsbD0idXJsKCNqKSIvPgogIDxwYXRoIGQ9Im00NDgzLjMgMTcyMi44YzQ0LjQtMzQuODE4IDEwMS43My0yNS4zMjkgMTUwLjI5IDIwLjczIDYwLjU3IDU4LjU3MyA3NS4xMzQgMTg4LjEzLTYuNDUyOCAyMjUuMDUtMTIwLjYxIDU0LjU3Mi0yNDYuNzEtMTY1LjExLTE0My44My0yNDUuNzh6IiBmaWxsPSJ1cmwoI2UpIi8+CiAgPHBhdGggZD0ibTQ2NDAuNSAxOTYwLjVjNTguMjkxLTM0LjY4MiA1MC40MTktMTYwLjkxLTUuODEyMi0yMTMuNzktNDMuOTg2LTQxLjcyLTEwMi4xOC01My4zNy0xNDIuODItMzAuNzA3bDMzNy4xOC0xNDkuM2M0NC42NTQtMjMuNTQyIDExNy42Mi0zMS4yNTIgMTY2LjgxIDIxLjE2NCAzMi4wNTYgMzQuMTU4IDQ3LjM2OCAxMjYuMTYtMTkuNjI5IDE3MC4xNGwtMzM1Ljc0IDIwMi41eiIgZmlsbD0idXJsKCNuKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+CiAgPHBhdGggZD0ibTQ0MzYuMyAxODg0LjhjMjEuMTg0IDkuNjYzNCAyNS42MzMgMjUuNDI3IDM1LjE1NiA1Mi4yMDZsODMuODE3LTQ1LjQyOGMyNS43OTktMjMuNTI4LTYuMDY5Mi03MS4wMDMtMzMuNDY4LTYzLjQ3MmwtODUuNTA2IDU2LjY5NHoiIGZpbGw9InVybCgjbykiIGZpbGwtcnVsZT0ibm9uemVybyIvPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMDE5NCAtLjAzODE3OSAtLjAwOTgyNDIgMS4zOTQzIDQwOC45NyAtMTAxMC41KSI+CiAgIDxwYXRoIGQ9Im00NjExLjIgMjUwOS44IDI3Ni41OS0xNjMuMzQtNDAyLjkyLTIyMC45My0yNjMuMDkgMTExLjk3IDM4OS40MiAyNzIuMjl6IiBmaWxsPSIjNWU4ODlkIi8+CiAgIDxwYXRoIGQ9Im00NjU0LjMgMjIzOC4zLTE2Ny4yNS05My43ODktOTEuMzgxIDQxLjEyOCAxNTguODUgMTAzLjEyIDk5Ljc3Ny01MC40NTR6bS0zODguNDQgNC42NzE2IDE2MC43NSAxMTIuODYgMTA4Ljc0LTU1LjQ0MS0xNTkuNTItMTA2LjA1LTEwOS45NyA0OC42MzF6bTI4Ny44MSA2Ni45MTYtMTA4LjUzIDU3LjYzOCAxNjcuMSAxMTYuMDYgMTEwLjkzLTYzLjI1NC0xNjkuNS0xMTAuNDR6bTE4Ni4xOSA5OS44MjggMTA5LjQ5LTYzLjI4OS0xNzQuMTQtOTcuNTcyLTEwMi41NCA1Mi44NSAxNjcuMTggMTA4LjAxeiIgZmlsbD0idXJsKCNmKSIgZmlsbC1ydWxlPSJub256ZXJvIi8+CiAgPC9nPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMTI5MiAuMDQwOTI1IC4xNjA3MiAxLjU0MTcgLTUyMy45NCAtMTc0NC40KSI+CiAgIDxwYXRoIGQ9Im01MDIyLjIgMjYxMC45IDI2MS41LTE4NC40MWM0LjQxOTQtNi4xNTYzLTIuMjgzNS0xMC43MTgtOS4wNjYyLTE0LjEzOWwtMzc5LjU0LTYxLjkwOS0yNzYuMTUgMTY0LjM1IDM4MS4zOCA5OS40NzJjOC4wNzY1IDEuMzAyNSAxNS4zMSAwLjAwODUgMjEuODY5LTMuMzYyMnoiIGZpbGw9IiM2Zjk1YTkiLz4KICAgPHBhdGggZD0ibTUwNTMuMiAyMzkyLjQtMTU2Ljg2LTI3LjY5Ni05Ni4wMjcgNTguODQ4IDE1NC43MiAzNS4xMjggOTguMTYxLTY2LjI4MXptLTM4OS4yNCAxMTMuODkgMTU5LjYgNDIuNjc5IDExMi40My03Ny4xNzUtMTU2LjUtMzUuNjQzLTExNS41MiA3MC4xNHptMjg5LjEzLTMwLjY3OC0xMTEuMDggNzcuMjQxIDE2NS45NiA0My4zNzQgMTE3LjI0LTgxLjk1OC0xNzIuMTMtMzguNjU3em0xODkuODIgMjUuNDU4IDEwOC41OC03NS41OTUtMTc5LjU3LTI5LjY4MS05OS45MTQgNjYuMjEgMTcwLjkxIDM5LjA2NnoiIGZpbGw9InVybCgjZykiIGZpbGwtcnVsZT0ibm9uemVybyIvPgogIDwvZz4KICA8cGF0aCBkPSJtNDgzNS4zIDE4NjcuOGMyMy40NzEgMjEuMjE3IDQxLjExIDAuNzAyNSAxOS4yNjctMTguMTkzbC0zMS44NjgtMzYuNTUxYy0xNi43OS0yMy41NTQtNDEuMjY0IDEwLjc2MS0zMi40MTEgMjYuNzc2bDM1LjM0MyAyNi4xOSAzLjgyODctMS44NTI0IDUuODQxMiAzLjYyOTN6IiBmaWxsPSJ1cmwoI3EpIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz4KICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCguOTk2MzMgLS4wODU1NzIgLjA4NTU3MiAuOTk2MzMgMjYzLjYxIC0zMC40MDQpIj4KICAgPHBhdGggZD0ibTQxNTEuMyAyODAzLjNjOTQuODU3LTI3LjM0MyAyNi4wNTYtMjEzLjc2LTE0OC4yOC00MDMuNjQtMTc1LjE4LTE4OS41OS0zOTcuOTMtMzI4LjA2LTQ4NS41OC0yODUuODMtNzkuNTg0IDM4LjMzOS0yNS4zNzcgMjEyLjM3IDE0OC43MiA0MDIuNDYgMTI5Ljc4IDEzOS40MiAzNjAuMTggMzIzLjA0IDQ4NS4xNCAyODcuMDJ6IiBmaWxsPSJ1cmwoI2MpIi8+CiAgIDxwYXRoIGQ9Im00MTU0LjcgMjc5NmM5NC44NTctMjcuMzQzIDI2Ljg4Ny0xODIuMzItMTMwLjg3LTM4My44OC0xNzUuNDQtMjI0LjE1LTM5Mi42MiA5NC4wNDQtMjU2LjkzIDE5Ni45MSAxMTMuMzQgODUuOTI0IDI2Mi44NCAyMjIuOTkgMzg3LjggMTg2Ljk3eiIgZmlsbD0idXJsKCNrKSIgb3BhY2l0eT0iLjUiLz4KICAgPHBhdGggZD0ibTM5NTAuNiAyMzcxLjRjNC4zOTAxLTUuNDIxMy0yNi45MjEtMzcuNzY4LTM0LjIxNS0zMi40NDRsLTI5OS4xOCAzMjEuMjRjLTExLjY4OSAxMy4wODQgMC43MzA4IDI0LjAzMiAxMi40OTYgMTEuMjc5bDMyMC45LTMwMC4wOHoiIGZpbGw9InVybCgjbCkiLz4KICAgPHBhdGggZD0ibTM1MTcuMyAyMTE0YzEyNC45Ni02Ny4zMiAzMzQuMjcgNC4xNDEgNDY5LjQxIDEyMy4xNiAxNDAuMDUgMTIzLjM0IDI0OS4zNSAzNTMuMyAyMDIuNyA1MjkuNyAyMy4xMzgtNjkuNzExLTQ4LjAyNC0yMTYuNDYtMTg2LjM3LTM2Ny4xNC0xNzUuMTgtMTg5LjU5LTM5Ni4xNy0zMjQuNTEtNDg1LjczLTI4NS43MnoiIGZpbGw9InVybCgjZCkiLz4KICAgPHBhdGggZD0ibTM5NTAuNiAyMzcxLjRjNC4zOTAxLTUuNDIxMy0yNi45MjEtMzcuNzY4LTM0LjIxNS0zMi40NDRsLTI5OS4xOCAzMjEuMjRjLTExLjY4OSAxMy4wODQgMC43MzA4IDI0LjAzMiAxMi40OTYgMTEuMjc5bDMyMC45LTMwMC4wOHoiIGZpbGw9InVybCgjbSkiLz4KICA8L2c+CiA8L2c+Cjwvc3ZnPgo='
    var billboards = scene.primitives.add(new Cesium.BillboardCollection());
    billboards.add({
        // image : './Tutorials/satellite1.svg',
        image : imageUri,
        position : topOnEllipsoid,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(-10, 10),
        scale: 0.3,
    });*/

    // 4 创建雷达放射波
    // 4.1 先创建Geometry
    var cylinderGeometry = new Cesium.CylinderGeometry({
        length: length,
        topRadius: 0.0,
        bottomRadius: length * 0.5,
        // vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
        vertexFormat: Cesium.MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat
    });
    // 4.2 创建GeometryInstance
    var redCone = new Cesium.GeometryInstance({
        geometry: cylinderGeometry,
        modelMatrix: modelMatrix,
        // attributes : {
        //     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)
        // }
    });
    // 4.3 创建Primitive
    var radar = viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: [redCone],
        // appearance : new Cesium.PerInstanceColorAppearance({
        //     closed : true,
        //     translucent: false
        // })
        appearance: new Cesium.MaterialAppearance({
            // 贴图像纹理
            // material: Cesium.Material.fromType('Image', {
            //     image: '../../SampleData/models/CesiumBalloon/CesiumBalloonPrint_singleDot.png'
            // }),

            // 贴棋盘纹理
            // material: Cesium.Material.fromType('Checkerboard'),

            // 自定义纹理
            material: new Cesium.Material({
                fabric: {
                    type: 'VtxfShader1',
                    uniforms: {
                        color: new Cesium.Color(0.2, 1.0, 0.0, 0.2),
                        repeat: 30.0,
                        offset: 0.0,
                        thickness: 0.3,
                    },
                    source: `
                                uniform vec4 color;
                                uniform float repeat;
                                uniform float offset;
                                uniform float thickness;

                                czm_material czm_getMaterial(czm_materialInput materialInput)
                                {
                                    czm_material material = czm_getDefaultMaterial(materialInput);
                                    float sp = 1.0/repeat;
                                    vec2 st = materialInput.st;
                                    float dis = distance(st, vec2(0.5));
                                    float m = mod(dis + offset, sp);
                                    float a = step(sp*(1.0-thickness), m);

                                    material.diffuse = color.rgb;   //diffuse 入射光在所有方向均匀散射。
                                    material.alpha = a * color.a;   //alpha 材料的不透明度

                                    return material;
                                }
                            `
                },
                translucent: false
            }),
            faceForward: false, // 当绘制的三角面片法向不能朝向视点时，自动翻转法向，从而避免法向计算后发黑等问题
            closed: true // 是否为封闭体，实际上执行的是是否进行背面裁剪
        }),
    }));

    // 5 动态修改雷达材质中的offset变量，从而实现动态效果。
    viewer.scene.preUpdate.addEventListener(function () {
        var offset = radar.appearance.material.uniforms.offset;
        offset -= 0.001;
        if (offset > 1.0) {
            offset = 0.0;
        }
        radar.appearance.material.uniforms.offset = offset;
    });
}

/**
 * 自定义几何
 * @param option
 */
function building(option) {
    var varr = [0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1];

    var three = 1;
    for (var i = 1; i < varr.length; i++) {
        three += 1;
        if (three == 3) {
            three = 1;
            varr
        }
    }
    var positions = new Float64Array(varr);
    var facearr = [0, 1, 2, 0, 3, 2, 0, 5, 3, 4, 3, 5, 5, 7, 4, 6, 4, 7, 1, 7, 6, 6, 2, 1];
    var indices = new Float32Array(facearr);

    var attributes = new Cesium.GeometryAttributes({
        position: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
            componentsPerAttribute: 3,
            values: positions
        })
    });

    var boundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(1.0, 1.0, 1.0), 1.0);

    var geometry = Cesium.GeometryPipeline.computeNormal(new Cesium.Geometry({
        attributes: attributes,
        indices: indices,
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingSphere: boundingSphere
    }));

    var positionOnEllipsoid = Cesium.Cartesian3.fromDegrees(110, 35);
    //模型矩阵
    var modelMatrix = Cesium.Matrix4.multiplyByTranslation(
        Cesium.Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid),
        new Cesium.Cartesian3(0.0, 0.0, 400000 * 0.5), new Cesium.Matrix4()
    );

    //四面体的实例
    var instance = new Cesium.GeometryInstance({
        geometry: geometry,
        modelMatrix: modelMatrix,
        // attributes: {
        //     color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.WHITE)    //白色
        // }
    });


    //加入场景
    /*viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: instance,
        appearance: new Cesium.PerInstanceColorAppearance({
            flat: true,
            translucent: false
        })
    }));*/
    //加入场景
    viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: instance,
        appearance: new Cesium.MaterialAppearance({

            // 自定义纹理
            material: new Cesium.Material({
                fabric: {
                    type: 'VtxfShader1',
                    uniforms: {
                        color: new Cesium.Color(0.2, 1.0, 0.0, 1),
                        repeat: 30.0,
                        offset: 0.0,
                        thickness: 0.3,
                    },
                    source: `
                                uniform vec4 color;
                                uniform float repeat;
                                uniform float offset;
                                uniform float thickness;

                                czm_material czm_getMaterial(czm_materialInput materialInput)
                                {
                                    czm_material material = czm_getDefaultMaterial(materialInput);
                                    float sp = 1.0/repeat;
                                    vec2 st = materialInput.st;
                                    float dis = distance(st, vec2(0.5));
                                    float m = mod(dis + offset, sp);
                                    float a = step(sp*(1.0-thickness), m);

                                    material.diffuse = color.rgb;   //diffuse 入射光在所有方向均匀散射。
                                    material.alpha = a * color.a;   //alpha 材料的不透明度

                                    return material;
                                }
                            `
                },
                translucent: false
            }),
            faceForward: false, // 当绘制的三角面片法向不能朝向视点时，自动翻转法向，从而避免法向计算后发黑等问题
            closed: true // 是否为封闭体，实际上执行的是是否进行背面裁剪
        }),
    }));

}

/**
 * 尾迹线
 */
function newPolyLine() {

    var end = [lng, lat];

    for (var i = 0; i < 30; i++) {
        var points = getCurveDynamicPointsAndLine([Math.random() * (Math.random(1) > 0.5 ? 1 : -1) * 180, Math.random() * (Math.random(1) > 0.5 ? 1 : -1) * 90], end, 3000000);
        var material = new Cesium.PolylineTrailLinkMaterialProperty(new Cesium.Color(Math.random(1), Math.random(1), Math.random(1), 1), 3000);

        viewer.entities.add({
            name: 'PolylineTrailLink',
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(points),
                width: 2,
                material: material,
            }
        });
    }

}

/**
 * 后期渲染
 */
function postProcess() {
    /*var Blur = `uniform float height;
                uniform float width;
                uniform sampler2D colorTexture1;
                varying vec2 v_textureCoordinates;
                const int SAMPLES = 2;
                void main()
                {
                vec2 st = v_textureCoordinates;
                float wr = float(1.0 / width);
                float hr = float(1.0 / height);
                vec4 result = vec4(0.0);
                int count = 0;
                for(int i = -SAMPLES; i <= SAMPLES; ++i){
                    for(int j = -SAMPLES; j <= SAMPLES; ++j){
                        vec2 offset = vec2(float(i) * wr, float(j) * hr);
                        result += texture2D(colorTexture1, st + offset);
                        ++count;
                    }
                }
                result = result / float(count);
                gl_FragColor = result;
                }`;
    var blurX = new Cesium.PostProcessStage({
        name : 'blur_x_direction',
        fragmentShader : Blur,
        uniforms: {
            width : window.innerWidth,
            height : window.innerHeight,
            colorTexture1: 3
        }
    });

    viewer.scene.postProcessStages.add(blurX);*/

    //后期处理里亮度
    var brightness = viewer.scene.postProcessStages.add(Cesium.PostProcessStageLibrary.createBrightnessStage());
    brightness.enabled = true;
    brightness.uniforms.brightness = 1;
}