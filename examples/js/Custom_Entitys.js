// lng 经  lat 纬

var cusEntity = {

    stats: function () {

    },

    /**
     * 水纹
     * lng: 经度
     * lat: 纬度
     * color: 颜色
     * cylSize: 圆大小
     * height: 高
     * alpha: 透明度
     * speed: 扩散速度
     * @param option
     */
    water: function (option) {
        var r = 0, clyA = 1;
        var opt = {
            n: parseFloat(option.lng),
            a: parseFloat(option.lat),
            c: option.color || [255, 255, 0],
            cs: option.cylSize || 200,
            s: (option.size || 200) * 200,
            h: option.height || 1,
            al: option.alpha || 1,
            up: option.speed || 1,
            name: option.name || 'water',
            // id: option.id || '',
        };

        function paintCyl(r, rgb, a) {
            var color = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',';
            var s = opt.cs / 2;
            var canvas = document.createElement('canvas');
            canvas.width = opt.cs.toString();
            canvas.height = opt.cs.toString();
            var context = canvas.getContext("2d");

            context.beginPath();
            var grad = context.createRadialGradient(s, s, 0, s, s, r);
            grad.addColorStop(0, color + '0)');
            grad.addColorStop(0.5, color + '0.1)');
            grad.addColorStop(1, color + a + ')');

            context.fillStyle = grad;
            // context.globalAlpha = a;
            context.arc(s, s, r, 0, 2 * Math.PI, true);
            context.fill();

            return canvas;
        }

        var changeAxis = function () {
            return 1;
        };
        var create = function () {
            var obj = viewer.entities.add({
                name: opt.name,
                // id: opt.id,
                position: Cesium.Cartesian3.fromDegrees(opt.n, opt.a, opt.h),
                ellipse: {
                    show: true,
                    semiMinorAxis: opt.s,
                    semiMajorAxis: opt.s,
                    height: opt.h,
                    fill: true,
                    material: new Cesium.Color(opt.c[0] / 255, opt.c[1] / 255, opt.c[2] / 255, opt.al),
                    outlineWidth: new Cesium.CallbackProperty(changeAxis, false),
                    outline: false,
                }
            });
            obj.isAvailable = function () {
                r = (r >= opt.cs ? 0 : r);
                clyA = (1 - r / opt.cs);
                var materil = paintCyl(r += opt.up, opt.c, clyA);
                this.ellipse.material = new Cesium.ImageMaterialProperty({
                    image: materil,
                    transparent: true
                });
                return true;
            };
            return obj;
        };
        return create();
    },

    /**
     * 飞线
     * @param option
     * slng: 起始经度
     * slat: 起始纬度
     * elng: 终点经度
     * elat: 终点纬度
     * size: 线宽
     * height: 飞线高度
     * color: 飞线颜色
     * lo: 底线不透明度
     * fo: 飞线不透明度
     */
    flyline: function (option) {
        var opt = {
            sn: parseFloat(option.slng),
            sa: parseFloat(option.slat),
            en: parseFloat(option.elng),
            ea: parseFloat(option.elat),
            s: option.size || 3,
            h: parseFloat(option.height) || 550000 * 4,
            c: option.color || [118, 233, 241],
            lo: option.linealpha || 0.2,
            fo: option.flyalpha || 0.8,
            name: option.name || 'flyline',
            flag: option.flag || false,
            flyflag: option.flyflag || false,
            info: option.info,
        };
        var path = getCurveDynamicPointsAndLine([opt.sn, opt.sa], [opt.en, opt.ea], opt.h);



        var create = function () {
            if(opt.flag) {
                viewer.entities.add({
                    name: opt.name,
                    info: opt.info,
                    polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArrayHeights(path),
                        width: opt.s,
                        shadows: Cesium.ShadowMode.ENABLED,
                        material: new Cesium.Color(opt.c[0] / 255, opt.c[1] / 255, opt.c[2] / 255, opt.lo),
                        bloomEffect: true,
                    }
                });
            }

            if(opt.flyflag) {
                viewer.entities.add({
                    name: opt.name,
                    info: opt.info,
                    polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArrayHeights(path),
                        width: opt.s,
                        shadows: Cesium.ShadowMode.ENABLED,
                        material: new Cesium.PolylineTrailMaterialProperty({
                            color: new Cesium.Color(opt.c[0] / 255, opt.c[1] / 255, opt.c[2] / 255, opt.fo),
                            trailLength: 0.2,
                            period: 5.0
                        }),
                        bloomEffect: true,

                    }
                });
            }
        };
        return create();
    },

    /**
     *
     * @param opt
     * url: 资源地址
     * bwidth: 底线宽
     * twidth: 动线宽
     * bcolor: 底线颜色
     * tcolor: 动线颜色
     * balpha: 底线不透明度
     * talpha: 动线不透明度
     */
    route: function (option) {
        var opt = {
            url: option.url,
            bw: option.bwidth || 5,
            tw: option.twidth || 5,
            bc: option.bcolor || [118, 233, 241],
            tc: option.tcolor || [118, 233, 241],
            bo: option.balpha || 0.2,
            to: option.talpha || 1,
            name: option.name || 'route',
            // id: option.id || '',
        };
        var jsonSource = new Cesium.GeoJsonDataSource(opt.name);
        // Cesium.GeoJsonDataSource.load(opt.url).then(function (dataSource) {
        jsonSource.load(opt.url).then(function (dataSource) {
            viewer.dataSources.add(dataSource);
            var routesBottom = dataSource.entities.values;
            for (var i = 0; i < routesBottom.length; i++) {
                var line = routesBottom[i];
                line.polyline.material = new Cesium.Color(opt.bc[0] / 255, opt.bc[1] / 255, opt.bc[2] / 255, opt.bo);
                line.polyline.width = opt.bw;
                line.polyline.height = 20;
            }
        }).otherwise(function (error) {
            window.alert(error);
        });

        Cesium.GeoJsonDataSource.load(opt.url).then(function (dataSource) {
            viewer.dataSources.add(dataSource);
            var routesTop = dataSource.entities.values;
            for (var i = 0; i < routesTop.length; i++) {
                var line = routesTop[i];
                line.polyline.material = new Cesium.PolylineTrailMaterialProperty({
                    color: new Cesium.Color(opt.tc[0] / 255, opt.tc[1] / 255, opt.tc[2] / 255, opt.to),
                    trailLength: 0.2,
                    period: 5.0
                });
                line.polyline.width = opt.tw;
                line.polyline.height = 20;
            }
        }).otherwise(function (error) {
            window.alert(error);
        });
    },

    /**
     * 普通点
     * @param option
     */
    point: function (option) {
        var opt = {
            height: option.height || 0,
            size: option.size || 5,
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            color: option.color || [255, 255, 255],
            alpha: option.alpha || 1,
            linewidth: option.linewidth || 0,
            linecolor: option.linecolor || [0, 0, 0],
            linealpha: option.linealpha || 1,
            name: option.name || 'point',
            // id: option.id || '',
        };
        var pt = viewer.entities.add({
            // id: opt.id,
            name: opt.name,
            position: Cesium.Cartesian3.fromDegrees(opt.lng, opt.lat, opt.height),
            point: {
                color: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.alpha),
                pixelSize: opt.size,
                scaleByDistance: new Cesium.NearFarScalar(1.0e1, 1.0, 1.0e10, 0.1),
                outlineWidth: opt.linewidth,
                outlineColor: new Cesium.Color(opt.linecolor[0] / 255, opt.linecolor[1] / 255, opt.linecolor[2] / 255, opt.linealpha),
                // translucencyByDistance : new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0),
                // disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }
        });
    },

    /**
     * 点集群
     * @param option
     * @constructor
     */
    pointPrimitiveCollection: function (option) {
        var opt = {
            fn: option.fn,
            data: option.data,
            height: option.height || 0,
            size: option.size || 2,
            color: option.color || [255, 255, 255],
            alpha: option.alpha || 1,
            name: option.name || 'point',
            linewidth: option.linewidth || 0,
            linecolor: option.linecolor || [0, 0, 0],
            linealpha: option.linealpha || 1,
            // id: option.id || '',
        };
        var points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection({
            // blendOption : Cesium.BlendOption.OPAQUE_AND_TRANSLUCENT,
            // blendOption : Cesium.BlendOption.TRANSLUCENT,
        }));
        points._rs = Cesium.RenderState.fromCache({
            depthTest: {
                enabled: true
            },
            depthMask: false,
            blending: Cesium.BlendingState.ADDITIVE_BLEND
        });
        for (var i = 0; i < opt.data.length; i++) {
            var pt = points.add({
                name: opt.name,
                position: Cesium.Cartesian3.fromDegrees(opt.data[i].longitude, opt.data[i].latitude, opt.height),
                color: new Cesium.Color(opt.color[0] / 255, opt.color[1] /255, opt.color[2]/255, opt.alpha),
                pixelSize: opt.size,
                scaleByDistance: new Cesium.NearFarScalar(1.0e1, 1.0, 1.0e10, 0.1),
                outlineWidth: opt.linewidth,
                outlineColor: new Cesium.Color(opt.linecolor[0] / 255, opt.linecolor[1] / 255, opt.linecolor[2] / 255, opt.linealpha),
            });
        }
        if(opt.fn){
            opt.fn();
        }
    },

    /**
     * 线集群
     * @param option
     * @constructor
     */
    polylineCollection: function (option) {
        var opt = {
            data: option.data,
            elng: parseFloat(option.elng),
            elat: parseFloat(option.elat),
            size: option.size || 3,
            height: option.height || 550000 * 4,
            color: option.color || [118, 233, 241],
            lo: option.linealpha || 0.2,
            fo: option.flyalpha || 0.8,
            name: option.name || 'flyline',
            flag: option.flag || false,
        };

        var polylines = viewer.scene.primitives.add(new Cesium.PolylineCollection());
        for(var i=0; i<opt.data.length; i++) {
            var path = getCurveDynamicPointsAndLine([opt.data[i].longitude, opt.data[i].latitude], [opt.elng, opt.elat], opt.height);

            if(opt.flag) {
                polylines.add({
                    name: opt.name,
                    polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArrayHeights(path),
                        width: opt.size,
                        shadows: Cesium.ShadowMode.ENABLED,
                        material: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.lo),
                    }
                });
            }

            polylines.add({
                name: opt.name,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights(path),
                    width: opt.size,
                    shadows: Cesium.ShadowMode.ENABLED,
                    material: new Cesium.PolylineTrailMaterialProperty({
                        color: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.fo),
                        trailLength: 0.2,
                        period: 5.0
                    }),

                }
            });
        }
    },

    /**
     * 广告牌
     * @param option
     */
    billboard: function (option) {
        var opt = {
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            height: option.height || 0,
            color: option.color,
            bgcolor: option.bgcolor || [255, 255, 255],
            text: option.text,
            bgsize: option.bgsize || 48,
            bgalpha: option.bgalpha || 1,
            scale: option.scale || 1,
            name: option.name || 'billboard',
            // id: option.id || '',
        };
        var pinBuilder = new Cesium.PinBuilder();
        var textM = pinBuilder.fromText(opt.text, new Cesium.Color(opt.bgcolor[0] / 255, opt.bgcolor[1] / 255, opt.bgcolor[2] / 255, opt.bgalpha), opt.bgsize).toDataURL();
        var bill = viewer.entities.add({
            name: opt.name,
            // id: opt.id,
            position: Cesium.Cartesian3.fromDegrees(opt.lng, opt.lat, opt.height),
            billboard: {
                show: true,
                scale: opt.scale,
                image: textM,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            }
        });
        bill.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    },

    imgbillboard: function (option) {
        var opt = {
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            height: option.height || 0,
            bgcolor: option.bgcolor || [255, 255, 255],
            scale: option.scale || 1,
            name: option.name || 'imgbillboard',
            url: option.url,
            deeptest: option.deeptest || false,
            info: option.info,
            id: option.id,
        };
        try {
            if (opt.id) {
                var bill = viewer.entities.add({
                    name: opt.name,
                    info: opt.info,
                    id: opt.id,
                    position: Cesium.Cartesian3.fromDegrees(parseFloat(opt.lng), parseFloat(opt.lat), opt.height),
                    billboard: {
                        show: true,
                        scale: opt.scale,
                        image: opt.url,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        disableDepthTestDistance: (opt.deeptest ? 0 : Number.POSITIVE_INFINITY),
                    }
                });
            } else {
                var bill2 = viewer.entities.add({
                    name: opt.name,
                    info: opt.info,
                    // id: opt.id,
                    position: Cesium.Cartesian3.fromDegrees(parseFloat(opt.lng), parseFloat(opt.lat), opt.height),
                    billboard: {
                        show: true,
                        scale: opt.scale,
                        image: opt.url,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        disableDepthTestDistance: (opt.deeptest ? 0 : Number.POSITIVE_INFINITY),
                    }
                });
            }
        }catch (e){
            // console.log(opt.lng + "----------------"+opt.lat);
        }
    },


    /**
     * 文本
     * @param option
     */
    label: function (option) {
        var opt = {
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            height: option.height || 0,
            text: option.text || '',
            font: option.font || '16px Helvetica',
            color: option.color || [255, 255, 255, 1],
            linewidth: option.linewidth || 2,
            linecolor: option.linecolor || [0, 0, 0, 1],
            disable: option.disable || 1000000,
            name: option.name || 'label',
            // id: option.id || '',
        };
        viewer.entities.add(new Cesium.Entity({
            // id: opt.id,
            name: opt.name,
            position: Cesium.Cartesian3.fromDegrees(opt.lng, opt.lat, opt.height),
            label: {
                text: opt.text,
                font: opt.font,
                fillColor: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.color[3]),
                outlineColor: new Cesium.Color(opt.linecolor[0] / 255, opt.linecolor[1] / 255, opt.linecolor[2] / 255, opt.linecolor[3]),
                outlineWidth: opt.linewidth,
                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e8, 0.0),
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                distanceDisplayCondition: opt.disable, //在此据距离范围内显示
                // disableDepthTestDistance: Number.POSITIVE_INFINITY, //深度测试
                // pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,//圆点相对于水平对象的中心
                verticalOrigin: Cesium.VerticalOrigin.TOP,//圆点相对于垂直对象的底部
            }
        }));
    },

    /**
     * 平贴地表点对象
     * @param option
     */
    ellipse: function (option) {
        var opt = {
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            size: option.size || 15000,
            height: option.height || 1,
            color: option.color || [255, 255, 255, 1],
            linewidth: option.linewidth || 0,
            name: option.name || 'ellipse',
            // id: option.id || '',
        };

        var obj = viewer.entities.add({
            name: opt.name,
            // id: opt.id,
            position: Cesium.Cartesian3.fromDegrees(opt.lng, opt.lat, opt.height),
            ellipse: {
                show: true,
                semiMinorAxis: opt.size,
                semiMajorAxis: opt.size,
                height: opt.h,
                fill: true,
                material: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.color[3]),
                outlineWidth: opt.linewidth,
                outline: true,
            }
        });
    },

    /**
     * 边界线
     * @param option
     */
    border: function (option) {
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
        Cesium.loadJson(opt.url).then(function (jsonData) {
            var jsonSource = new Cesium.GeoJsonDataSource(opt.name);
            var data = jsonSource.load(jsonData, {
                stroke: new Cesium.Color(opt.color[0] / 255, opt.color[1] / 255, opt.color[2] / 255, opt.color[3]),
                fill: new Cesium.Color(opt.fillcolor[0] / 255, opt.fillcolor[1] / 255, opt.fillcolor[2] / 255, opt.fillcolor[3]),
                strokeWidth: opt.width
            });
            viewer.dataSources.add(data);
            index = viewer.dataSources.indexOf(jsonSource);

            if(opt.fn){
                opt.fn();
            }
        }).otherwise(function (error) {
            console.log('border error:'+ error);
        });

        // return index;
    },


    /**
     * 建筑
     */
    building: function (option) {
        var opt = {
            url: option.url,    //arr
            fn: option.fn,
            color: option.color || 'rgba(0, 51, 102, 1.0)',
            linecolor: option.linecolor || 'rgba(0, 51, 102, 1.0)',
        };
        // for(var i=0; i<opt.url.length; i++){
            var promise = Cesium.GeoJsonDataSource.load(opt.url);
            promise.then(function (dataSource) {
                viewer.dataSources.add(dataSource);
                var entities = dataSource.entities.values;
                for (var i = 0; i < entities.length; i++) {
                    var entity = entities[i];
                    var lineColor = Cesium.Color.fromCssColorString("rgba(0, 51, 102, 1.0)");
                    var color = Cesium.Color.fromCssColorString("rgba(5,165,185, 1)");
                    entity.polygon.stroke = lineColor;
                    entity.polygon.material = color;
                    entity.polygon.outline = false;
                    entity.polygon.extrudedHeight = parseInt(entities[i].properties.Height._value);
                }
                if(opt.fn){
                    opt.fn();
                }
            }).otherwise(function (error) {
                console.log(error);
            });
        // }


    },



    /**
     * 相机移动
     * @param option
     */
    flyTo: function (option) {
        var opt = {
            fn: option.fn,
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            height: option.height,
            heading: option.heading || 0.0,
            pitch: option.pitch || 0.0,
            roll: option.roll || 0.0,
            duration: option.duration,
        };
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(opt.lng, opt.lat, opt.height),   //经度不变 纬度位置降低 高度降低
            duration: opt.duration,
            easingFunction: Cesium.EasingFunction.LINEAR_NONE,
            orientation: {
                heading: Cesium.Math.toRadians(opt.heading), //绕x轴旋转角
                pitch: Cesium.Math.toRadians(opt.pitch),   //绕z轴旋转角
                roll: opt.roll, //绕y轴旋转角
            },
            complete: function () {
                if (opt.fn) {
                    opt.fn();
                }
            }
        });
    },

    model:function (option) {
        var opt = {
            fn: option.fn,
            name: option.name || 'model',
            url: option.url,
            lng: parseFloat(option.lng),
            lat: parseFloat(option.lat),
            height: option.height || 0,
            min: option.min || 1000000,
            max: option.max || 400,
            scale: option.scale || 8,
            id: option.id,
        }

        viewer.entities.add({
            id: opt.id,
            name: opt.name,
            position: Cesium.Cartesian3.fromDegrees(opt.lng, opt.lat, opt.height),
            model: {
                uri : opt.url,
                minimumPixelSize: opt.min,
                maximumScale: opt.max,
                scale: opt.scale,
                shadows: Cesium.ShadowMode.ENABLED,
                // color: new Cesium.Color(1,1,1,0.996),
            }
        });
        if(opt.fn){
            opt.fn();
        }
    }





};


//拼装点数据
function getCurveDynamicPointsAndLine(startPoints, endPoints, height) {
    var fromHeight = 0;
    var pointNum = 100;
    var minNum = parseInt(pointNum / 2);

    var cv = calculate([startPoints, endPoints], pointNum);    //根据弧线的坐标节点数组
    var minPoint = [cv[minNum][0], cv[minNum][1], height];
    cv = calculate([[startPoints[0], startPoints[1], fromHeight], minPoint, [endPoints[0], endPoints[1], fromHeight]], pointNum);
    var pointArray = [];
    for (var j = 0; j < cv.length; j++) {
        pointArray.push(cv[j][0]);
        pointArray.push(cv[j][1]);
        pointArray.push(cv[j][2]);
    }
    return pointArray;
}

/**
 * @param poss      贝塞尔曲线控制点坐标,二维数组
 * @param precision 精度，需要计算的该条贝塞尔曲线上的点的数目
 * @return 该条贝塞尔曲线上的点（二维坐标）
 */
function calculate(poss, precision) {

    //维度，坐标轴数（二维坐标，三维坐标...）
    var dimersion = poss[0].length;

    //贝塞尔曲线控制点数（阶数）
    var number = poss.length;

    //控制点数不小于 2 ，至少为二维坐标系
    if (number < 2 || dimersion < 2)
        return null;
    //贝塞尔曲线点二维数组
    var result = [];

    //计算杨辉三角
    var mi = [];
    mi[0] = mi[1] = 1;
    for (var i = 3; i <= number; i++) {

        var t = new Array(i - 1);
        for (var j = 0; j < t.length; j++) {
            t[j] = mi[j];
        }

        mi[0] = mi[i - 1] = 1;
        for (var j = 0; j < i - 2; j++) {
            mi[j + 1] = t[j] + t[j + 1];
        }
    }

    //计算坐标点
    for (var i = 0; i <= precision; i++) {
        result[i] = [];
        var t = i / precision;
        for (var j = 0; j < dimersion; j++) {
            var temp = 0.0;
            for (var k = 0; k < number; k++) {
                temp += Math.pow(1 - t, number - k - 1) * poss[k][j] * Math.pow(t, k) * mi[k];
            }
            result[i][j] = temp;
        }
    }

    return result;
}