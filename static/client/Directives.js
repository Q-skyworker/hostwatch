app.directive('ztree', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            //Tree 主要操作对象
            scope.treeObj = {};
            //选项
            var opts;
            var viewSetting;
            opts = angular.extend({
                onClick: function (event, treeId, treeNode) {
                },
                onAddClick: function (treeId, treeNode) {
                },
                onRemoveClick: function (treeId, treeNode) {
                },
                showRemoveBtn: false,
                showAddBtn: false,
                asyncUrl: '',
                check: {},
                autoParam: [],
                data: {
                    key: {
                        name: "name"
                    }
                },
                onCheck: function (event, treeId, treeNode) {
                }
            }, scope.$eval(attrs.ztree));
            var addHoverDom = function (treeId, treeNode) {
                var aObj = $("#" + treeNode.tId + "_a");
                if ($("#diyBtn_" + treeNode.id).length > 0) return;
                var editStr = "<a class='treeAdd' style='width:18px;margin-left:3px;' id='diyBtn_" + treeNode.id
                    + "'onfocus='this.blur();'></a>";
                aObj.append(editStr);
                var btn = $("#diyBtn_" + treeNode.id);
                if (btn) btn.bind("click", function () {
                    opts.onAddClick(treeId, treeNode);
                });
            };
            var removeHoverDom = function (treeId, treeNode) {
                $("#diyBtn_" + treeNode.id).unbind().remove();
                $("#diyBtn_space_" + treeNode.id).unbind().remove();
            };
            if (opts.showAddBtn) {
                viewSetting = {
                    addHoverDom: addHoverDom,
                    removeHoverDom: removeHoverDom
                };
            } else {
                viewSetting = {
                    showIcon: false
                };
            }
            //Tree 设置
            var setting = {
                callback: {
                    onClick: function (event, treeId, treeNode) {
                        scope.$apply(opts.onClick(event, treeId, treeNode));
                    },
                    beforeRemove: opts.onRemoveClick,
                    onCheck: opts.onCheck
                },
                async: {
                    enable: true,
                    type: "get",
                    url: opts.asyncUrl,
                    autoParam: opts.autoParam
                },
                edit: {
                    enable: true,
                    showRemoveBtn: opts.showRemoveBtn,
                    showRenameBtn: false,
                    removeTitle: "删除组织",
                    drag: {
                        isCopy: false,
                        isMove: false
                    }
                },
                data: opts.data,
                view: viewSetting,
                check: opts.check
            };
            scope.$watch(attrs.ngModel, function (v) {
                if (v) {
                    scope.treeObj = $.fn.zTree.init(element, setting, v);
                    var nodes = scope.treeObj.getNodes();
                    if (nodes.length > 0) {
                        scope.treeObj.expandNode(nodes[0], true, true, true);
                    }
                }
            });
        }
    };
});

app.directive('dragable', ["$modalStack", function ($modalStack) {
    return {
        restrict: 'EA',
        template: ' <div class=\"modal-header\" style=\"cursor:move;padding-top:10px;\" ng-mouseup=\"releaseMe()\" ng-mousedown=\"dragMe()\">\
                        <div style=\"float: left;padding-top:5px;font-size:18px;\"><span>{{dialogTitle}}</span></div>\
                        <div style=\"float:right;padding-top:10px;overflow:hidden\">\
                            <div style=\"cursor: pointer;\" ng-click=\"closeDialog();\">\
                               <span style="font-size:16px" class="fa fa-close"></span>\
                            </div>\
                        </div>\
                    </div>',
        scope: {dialogTitle: '@'},
        replace: true,
        transclude: true,
        link: function (scope, elem, attr) {
            scope.dragMe = function () {
                //scope.dialogTitle
                elem.parent().parent().draggable();
            }
            scope.releaseMe = function () {
                elem.parent().parent().draggable('destroy');
            }
            scope.closeDialog = function () {
                var modal = $modalStack.getTop();
                $modalStack.dismiss(modal.key, 'backdrop click');
            };

        }
    }
}]);

app.directive('dragable1', ["$modalStack", function ($modalStack) {
    return {
        restrict: 'EA',
        template: ' <div class=\"modal-header-lg\" style=\"cursor:move;padding-top:10px;border-radius:6px 6px 0 0;\" ng-mouseup=\"releaseMe()\" ng-mousedown=\"dragMe()\">\
                        <div style=\"text-align: center;padding: 14px;font-size:18px;\"><span>{{dialogTitle}}</span><div style="cursor: pointer;float: right" ng-click="closeDialog();">\n                               <span style="font-size:20px;" class="fa fa-close"></span>\n                            </div>\
                        </div>\
                    </div>',
        scope: {dialogTitle: '@'},
        replace: true,
        transclude: true,
        link: function (scope, elem, attr) {
            scope.dragMe = function () {
                //scope.dialogTitle
                elem.parent().parent().draggable();
            }
            scope.releaseMe = function () {
                elem.parent().parent().draggable('destroy');
            }
            scope.closeDialog = function () {
                var modal = $modalStack.getTop();
                $modalStack.dismiss(modal.key, 'backdrop click');
            };

        }
    }
}]);

app.directive('dragable3', ["$modalStack", function ($modalStack) {
    return {
        restrict: 'EA',
        template: '<div style="width:100%;height:100%;" ng-mouseup=\"releaseMe()\" ng-mousedown=\"dragMe()\">\
            <span style="float: left; margin-left: 5px;">{{dialogTitle}}</span>\
            <span class="fa fa-lg fa-close fa-icon" style="float: right; margin-right: 5px; color: black" ng-click="closeDialog()"></span></div>',
        scope: {
            dialogTitle: '@',
            close: '&'
        },
        replace: true,
        transclude: true,
        link: function (scope, elem, attr) {
            scope.dragMe = function () {
                //scope.dialogTitle
                elem.parent().parent().draggable();
            }
            scope.releaseMe = function () {
                elem.parent().parent().draggable('destroy');
            }
            scope.closeDialog = function () {
                scope.close();
            };
        }
    }
}]);

app.directive('dragable2', ["$modalStack", function ($modalStack) {
    return {
        restrict: 'EA',
        template: ' <div class=\"modal-header\" style=\"cursor:move;padding-top:10px;\" ng-mouseup=\"releaseMe()\" ng-mousedown=\"dragMe()\">\
                        <div style=\"float: left;padding-top:10px;font-size:22px;\"><span>{{dialogTitle}}</span></div>\
                        <div style=\"float:right;padding-top:10px;overflow:hidden\">\
                            <div style=\"cursor: pointer;\" ng-click=\"closeDialog();\">\
                                <img src=\"' + static_url + 'img/delete.png\" />\
                            </div>\
                        </div>\
                    </div>',
        scope: {
            dialogTitle: '@',
            close: '&'
        },
        replace: true,
        transclude: true,
        link: function (scope, elem, attr) {
            scope.dragMe = function () {
                elem.parent().parent().draggable();
            }
            scope.releaseMe = function () {
                elem.parent().parent().draggable('destroy');
            }
            scope.closeDialog = function () {
                scope.close();
            };

        }
    }
}]);

app.directive('cwAdaptbody', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs, ngModel) {

            var adaptHeight = function () {
                CWApp.InitSiteHeight();
                var v = scope.$eval(attrs.cwAdaptbody);
                var winHeight = 0;
                if (window.innerHeight)
                    winHeight = window.innerHeight;
                if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
                    winHeight = document.documentElement.clientHeight;
                }
                $(element).css("height", (winHeight - CWApp.HeaderHeight - CWApp.BodyTopBarHeight - CWApp.FooterHeight - v) + 'px');
                // $(element).css("overflowY", 'auto');
            };
            adaptHeight();
            window.onresize = adaptHeight;
        }
    }
});

app.directive('cwAdaptmaxbody', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs, ngModel) {

            var adaptHeight = function () {
                CWApp.InitSiteHeight();
                var v = scope.$eval(attrs.cwAdaptmaxbody);
                var winHeight = 0;
                if (window.innerHeight)
                    winHeight = window.innerHeight;
                if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
                    winHeight = document.documentElement.clientHeight;
                }
                $(element).css("maxHeight", winHeight - CWApp.HeaderHeight - CWApp.BodyTopBarHeight - CWApp.FooterHeight - v + 'px');
                // $(element).css("overflowY", 'auto');
            };
            adaptHeight();
            window.onresize = adaptHeight;
        }
    }
});

app.directive('cwAdaptheight', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs, ngModel) {
            var winHeight = 0;
            if (window.innerHeight)
                winHeight = window.innerHeight;
            if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
                winHeight = document.documentElement.clientHeight;
            }
            $(element).css("height", (winHeight - CWApp.HeaderHeight - CWApp.BodyTopBarHeight - CWApp.FooterHeight - 12) + 'px');
        }
    }
});

app.directive('cwDatepicker', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs, ngModel) {
            var jqElement = $(element);
            $(element)[0].readOnly = true;
            jqElement.datepicker({
                dateFormat: "yy-mm-dd",
                //changeMonth: true,
                //changeYear: true,
                monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
                dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
                dayNamesMin: ['日', '一', '二', '三', '四', '五', '六']
            });

            jqElement.after('<span style="font-size: 16px;cursor: pointer;" onclick="$(this).prev(\'input\').focus();">\
                                </span>');
        }
    }
});

app.directive('cwUnderline', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: true,
        link: function (scope, element, attrs, ngModel) {
            scope.$watch(attrs.cwUnderline, function (v) {
                if (v) {
                    $(element).css('textDecoration', 'underline');
                } else {
                    $(element).css('textDecoration', 'none');
                }
            });
        }
    }
});

app.directive('modalwindowsize', function () {
    return {
        restrict: 'EA',
        scope: {
            parentwidth: '=parentwidth',
            parentheight: '=parentheight',
            parentleft: '=parentleft'
        },
        link: function (scope, element, attrs) {
            if (scope.parentwidth) {
                element.parent().width(scope.parentwidth);
            }
            if (scope.height) {
                element.parent().height(scope.parentheight);
            }
            if (scope.parentleft) {
                element.parent().css('left', scope.parentleft)
            }
        }
    };
});

app.directive('inputHint', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: false,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, element, attrs, ngModel) {
                    $scope.hint = attrs.inputHint;
                    var IType = $(element)[0].type;
                    var inputValue = $scope.$parent.$eval(attrs.ngModel);
                    $(element).on('focus', function () {
                        if ($(element)[0].value == $scope.hint) {
                            if (IType == "password")
                                $(element)[0].type = IType;
                            $(element)[0].value = '';
                        }
                        $(element)[0].style.color = 'black';
                    });

                    $(element).on('blur', function () {
                        if ($(element)[0].value == '') {
                            if (IType == "password")
                                $(element)[0].type = "text";
                            $(element)[0].style.color = '#aaa';
                            $(element)[0].value = $scope.hint;
                        }
                    });

                    $scope.$watch($(element)[0].value, function (a) {
                        if (a == undefined || a == null || a == "") {
                            if (inputValue == null || inputValue == "") {
                                if (IType == "password")
                                    $(element)[0].type = "text";
                                $(element)[0].value = $scope.hint;
                                $(element)[0].style.color = '#aaa';
                            }
                        } else {
                            $(element)[0].style.color = 'black';
                        }
                    })
                }
            }
        }
    }
});

app.directive('cwSlider', function () {
    return {
        restrict: 'EA',
        link: function (scope, element, attrs) {
            $(element).nivoSlider();
        }
    }
});

app.directive('highcharts', function () {
    return {
        require: '?ngModel',
        restrict: 'EA',
        link: function (scope, element, attrs, ngModel) {
            //选项
            var opts = angular.extend({
                title: {text: '', enabled: false},
                chart: {type: 'column'},
                credits: {enabled: false},
                //显示打印
                exporting: {
                    enabled: false
                },
                xAxis: {
                    labels: {
                        y: -10,     //x轴标签位置
                        enabled: false
                    }
                },
                yAxis: {
                    allowDecimals: true,
                    title: {
                        text: ' '
                    }
                },
                series: [],
                tooltip: {}
            }, scope.$eval(attrs.highcharts));
            // var chartrsID = "#" + pagerID;

            var opt_data = opts.data;
            var new_opts = {
                title: opts.title,
                chart: opts.chart,
                credits: opts.credits,
                exporting: opts.exporting,
                xAxis: opts.xAxis,
                yAxis: opts.yAxis,
                series: [],
                tooltip: opts.tooltip
            };

            var initChart = function () {
                new_opts.plotOptions = {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    },
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function (opt) {
                                    if (new_opts.series[opt.point.series.index].url != undefined)
                                        location.href = new_opts.series[opt.point.series.index].url;
                                }
                            }
                        }
                    }
                };
                $(element).highcharts(new_opts)
            };

            scope.$watch(opts.data, function (a) {
                if (a != undefined && a.length != undefined && a.length > 0) {
                    new_opts.series.splice(0, new_opts.series.length);
                    for (var i = 0; i < a.length; i++) {
                        new_opts.series.push(a[i]);
                        // new_opts.series[i].data = [a[i]];
                    }
                    initChart();
                }
            });

            // scope.$watch(opts.data + '.length', function (b) {
            //     if (b != undefined && b != 0) {
            //         new_opts.series.splice(0, new_opts.series.length);
            //         for (var i = 0; i < b; i++) {
            //             new_opts.series.push(opts.data[i]);
            //             // new_opts.series[i].data = [a[i]];
            //         }
            //         initChart();
            //     }
            // });


        }
    };
});

app.directive('highchartsgauge', function () {
    return {
        require: '?ngModel',
        restrict: 'EA',
        link: function (scope, element, attrs, ngModel) {
            var pagerID = Math.ceil(Math.random() * 1000000000);
            element.append("<div style='width:100%;height: 100%;' id=\"" + pagerID + "\" class=\"" + pagerID + "\">");
            //选项
            var char_id = "#" + pagerID;
            var gaugeOptions = angular.extend({
                chart: {
                    type: 'solidgauge'
                },
                title: null,
                pane: {
                    center: ['50%', '85%'],
                    size: '140%',
                    startAngle: -90,
                    endAngle: 90,
                    background: {
                        backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
                        innerRadius: '60%',
                        outerRadius: '100%',
                        shape: 'arc'
                    }
                },
                tooltip: {
                    enabled: false
                },
                // the value axis
                yAxis: {},
                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            y: 5,
                            borderWidth: 0,
                            useHTML: true
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                series_name: ""
            }, scope.$eval(attrs.highchartsgauge));

            var new_opts = {
                chart: gaugeOptions.chart,
                title: gaugeOptions.title,
                pane: gaugeOptions.pane,
                tooltip: gaugeOptions.tooltip,
                exporting: gaugeOptions.exporting,
                yAxis: {
                    stops: [
                        [0.1, '#55BF3B'], // green
                        [0.5, '#DDDF0D'], // yellow
                        [0.9, '#DF5353'] // red
                    ],
                    lineWidth: 0,
                    minorTickInterval: null,
                    tickAmount: 2,
                    title: {
                        y: -70
                    },
                    labels: {
                        y: 16
                    }
                }
            };

            // Bring life to the dials
            scope.$watch(gaugeOptions.data + '.length', function (b) {
                if (b != undefined && b != 0) {
                    scope.$watch(gaugeOptions.data, function (a) {
                        $(char_id).highcharts(Highcharts.merge(new_opts, {
                            yAxis: {
                                min: gaugeOptions.yAxis.min,
                                max: gaugeOptions.yAxis.max,
                                title: gaugeOptions.yAxis.title
                            },
                            credits: {
                                enabled: false
                            },
                            series: [{
                                name: gaugeOptions.series_name,
                                data: a,
                                dataLabels: {
                                    format: '<div style="text-align:center"><span style="font-size:25px;color:' +
                                        ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
                                        '<span style="font-size:12px;color:silver">' + gaugeOptions.series_name + '</span></div>'
                                },
                                tooltip: {
                                    valueSuffix: ' ' + gaugeOptions.series_name
                                }
                            }]
                        }));
                    })
                }
            })
        }
    }

});

app.directive('selectTree', ["$timeout", function ($timeout) {
    return {
        require: '?ngModel',
        restrict: 'EA',
        template: '<div class="custom-select" ng-class="controlClass" ng-click="toggleOpen()">\
        <input type="text" ng-model="inputItemObj.name" style="color:#858585" ng-blur="toggleBlur()" ng-focus="toggleFocus()"/>\
        <span><i class="icon-sort-down"></i></span>\
        <div class="list" ng-show="dropItem.isOpen">\
            <ul>\
                <li  ng-class="{\'active\':inputItemObj.id === member.id}" ng-include="subLevelHtml" ng-repeat="member in collection track by member.id"></li>\
            </ul>\
        </div>\
    </div>',
        replace: true,
        scope: {
            options: '=?',
            collection: '=?'
        },
        transclude: true,
        link: function ($scope, elem, attr, ngModel) {
            $scope.subLevelHtml = static_url + 'client/views/sub_level.html';
            $scope.dropItem = {isOpen: false};
            $scope.inputItemObj = $scope.$parent.$eval(attr.ngModel);

            $scope.findNode = function (data) {
                for (var i in data) {
                    if (data[i].id == $scope.inputItemObj.id) {
                        $scope.inputItemObj.name = data[i].name;
                        return true;
                    }
                    if (data[i].children) {
                        if ($scope.findNode(data[i].children))
                            return true;
                    }
                }
            };

            if ($scope.inputItemObj.id) {
                $scope.findNode($scope.collection);
            }

            $scope.toggleOpen = function () {
                $scope.dropItem.isOpen = true;
            };

            $scope.toggleBlur = function () {
                $timeout(function () {
                    $scope.dropItem.isOpen = false;
                }, 200);
            };

            $scope.toggleFocus = function () {
                $scope.dropItem.isOpen = true;
            };

            $scope.selectValue = function (member) {
                $scope.inputItemObj.id = member.id;
                $scope.inputItemObj.name = member.name;
            }

            $scope.$watch("collection", function (a) {
                $scope.findNode(a);
            })
        }
    }
}]);

app.directive('cwPiechart', function () {
    return {
        require: '?ngModel',
        restrict: 'EA',
        replace: false,
        link: function (scope, element, attrs, ngModel) {
            var opts = angular.extend({
                exporting: {
                    enabled: false
                },
                title: {
                    text: "",
                    enabled: true
                },
                unit: "",
                size: "250px"
            }, scope.$eval(attrs.cwPiechart));
            scope.$watch(opts.data, function (v) {
                $(element).highcharts({
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie'
                    },
                    exporting: opts.exporting,
                    title: opts.title,
                    // tooltip: {
                    //     pointFormat: '<b>{point.y}</b>',
                    //     color: '#fcfcfc'
                    // },
                    tooltip: {
                        pointFormat: '{point.y}' + opts.unit
                    },
                    credits: {enabled: false},
                    plotOptions: {
                        pie: {
                            size: opts.size,
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            }
                        }
                    },
                    // dataLabels: {
                    //     enabled: true,
                    //     color: '#fcfcfc',
                    //     connectorColor: '#4572A7'
                    // },
                    series: [{
                        data: v
                    }]
                });
            }, true);
        }
    }
});

app.directive('cwDatetimepicker', function () {
    return {
        require: '?ngModel',
        restrict: 'EA',
        transclude: true,
        link: function ($scope, element, attr, ngModel) {
            $scope.inputItemObj = $scope.$eval(attr.ngModel);
            $(element).kendoDateTimePicker({
                value: $scope.inputItemObj,
                format: "yyyy-MM-dd HH:mm"
            });
            $(element)[0].readOnly = true;

        }
    }
});


app.directive('cwServercheck', ['sysService', '$modal', "errorModal", 'loading', function (sysService, $modal, errorModal, loading) {
    return {
        require: '?ngModel',
        template: '<div><form ng-submit="cwAdusercheck_checkEmployee()">\
            <input type="text" ng-disabled="dialogDisabled" class="{{dialogClass}}" style="width:150px;" input-hint="{{dialogTitle}}" ng-change="cwAdusercheck_filterOnChange();" ng-model="cwAdusercheck_selectedEmployee.displayName" cw-underline="cwAdusercheck_selected" />\
            <button style="margin-top:-4px;" ng-disabled="dialogDisabled" ng-click="cwAdusercheck_checkEmployee();" type="button" class="btn btn-info">\
                  检查姓名\
            </button></form></div>',
        scope: {dialogTitle: '@', dialogClass: "@", dialogDisabled: "@"},
        restrict: 'A',
        replace: true,
        link: function (scope, element, attrs, ngModel) {
            var opts;
            opts = angular.extend({
                onCallBack: function (selectedEmployee) {

                },
                userModel: ""
            }, scope.$parent.$eval(attrs.cwAdusercheck));
            scope.cwAdusercheck_selectedEmployee = scope.$parent.$eval(attrs.ngModel);
            scope.cwAdusercheck_selected = false;
            scope.cwAdusercheck_checkEmployee = function () {
                var filterText = scope.cwAdusercheck_selectedEmployee.displayName;
                if (filterText == '' || filterText == undefined) {
                    errorModal.open(['请输入查询条件！']);
                    return;
                }
                loading.open();
                userService.search_server({filterStr: filterText}, {}, function (res) {
                    loading.close();
                    if (!res.is_success) {
                        errorModal.open(res.message.split(";"));
                        return;
                    }
                    var data = res.data;
                    if (data.length == 0) {
                        errorModal.open(["找不到与" + filterText + "匹配的用户"]);
                    } else if (data.length == 1) {
                        scope.cwAdusercheck_selectedEmployee.displayName = data[0].displayName;
                        scope.cwAdusercheck_selectedEmployee.account = data[0].account;
                        scope.cwAdusercheck_selectedEmployee.mail = data[0].mail;
                        scope.cwAdusercheck_selected = true;
                        opts.onCallBack(scope.cwAdusercheck_selectedEmployee);
                    } else {
                        var modalInstance = $modal.open({
                            templateUrl: static_url + 'client/views/Utilities/serverSelect.html',
                            controller: 'serverSelectCtrl',
                            windowClass: 'dialogUserSelect',
                            backdrop: 'static',
                            resolve: {
                                employeeList: function () {
                                    data.title = '用户';
                                    return data;
                                }
                            }
                        });
                        modalInstance.result.then(
                            function (selected) {
                                scope.cwAdusercheck_selectedEmployee.displayName = selected.displayName;
                                scope.cwAdusercheck_selectedEmployee.account = selected.account;
                                scope.cwAdusercheck_selectedEmployee.mail = selected.mail;
                                scope.cwAdusercheck_selected = true;
                                opts.onCallBack(scope.cwAdusercheck_selectedEmployee);
                            });
                    }
                });
            };
            scope.cwAdusercheck_filterOnChange = function () {
                scope.cwAdusercheck_selected = false;
                scope.cwAdusercheck_selectedEmployee.account = '';
            };
            scope.$watch(opts.userModel, function (a) {
                if (a != undefined)
                    scope.cwAdusercheck_selectedEmployee = a;
            })
        }
    }
}])

app.directive('cwSelect2', ["$timeout", function ($timeout) {
    return {
        require: '?ngModel',
        restrict: 'EA',
        transclude: true,
        link: function ($scope, elem, attr, ngModel) {
            $scope.inputItemObj = $scope.$eval(attr.ngModel);
            $scope.opt = angular.extend({
                data: "",
                multiple: false,
                modelDate: ""
            }, $scope.$eval(attr.cwSelect2));
            var modelDate = $scope.opt.multiple ? $scope.inputItemObj.split(",") : $scope.inputItemObj
            $scope.newData = [];
            $scope.$watch("opt.data", function (a) {
                if (a != undefined) {
                    $scope.newData = a;
                    $(elem).select2({data: a, multiple: $scope.opt.multiple});
                    $(elem).select2("val", modelDate);
                }
            });

            $scope.$watch("opt.data" + ".length", function (a) {
                if (a != undefined && a != 0) {
                    $(elem).select2({data: $scope.newData, multiple: $scope.opt.multiple});
                    $(elem).select2("val", modelDate);
                }
            });

            $scope.$watch($scope.opt.modelDate, function (a) {
                if (a != undefined) {
                    if (a == "") {
                        var newDate = $scope.opt.multiple ? [] : "";
                        $(elem).select2("val", newDate);

                    }
                }
            })
        }
    }
}]);

app.directive('cwSelectstr2', ["$timeout", function ($timeout) {
    return {
        require: '?ngModel',
        restrict: 'EA',
        transclude: true,
        link: function ($scope, elem, attr, ngModel) {
            // $scope.inputItemObj = $scope.$eval(attr.ngModel);
            var opt = angular.extend({
                data: "",
                multiple: false,
                modelData: "",
                modelText: ""
            }, $scope.$eval(attr.cwSelectstr2));
            $scope.newData = [];
            $scope.$watch(opt.data, function (a) {
                if (a != undefined) {
                    $scope.newData = a;
                    $(elem).select2({data: a, multiple: opt.multiple});
                    $scope.inputItemObj = $scope.$eval(attr.ngModel);
                    if ($scope.inputItemObj != undefined) {
                        // var tmp = attr()
                        var dataObj = opt.multiple ? $scope.inputItemObj.split(",") : $scope.inputItemObj;
                        $(elem).select2("val", dataObj);
                    }
                }
            });

            $scope.$watch(opt.modelData, function (a) {
                if (a != undefined) {
                    var newDate;
                    if (a == "") {
                        newDate = opt.multiple ? [] : "";
                    } else {
                        newDate = opt.multiple ? a.split(",") : a;
                    }
                    $(elem).select2("val", newDate);
                }
            })
        }
    }
}]);

app.directive('stringHtml', function () {
    return function (scope, el, attr) {
        if (attr.stringHtml) {
            scope.$watch(attr.stringHtml, function (html) {
                el.html(html || '');//更新html内容
            });
        }
    };
});

app.directive('ngFileSelect', ['$parse', '$timeout', function ($parse, $timeout) {
    return function (scope, elem, attr) {
        var fn = $parse(attr['ngFileSelect']);
        elem.bind('change', function (evt) {
            var files = [], fileList, i;
            fileList = evt.target.files;
            if (fileList != null) {
                for (i = 0; i < fileList.length; i++) {
                    files.push(fileList.item(i));
                }
            }
            $timeout(function () {
                fn(scope, {
                    $files: files,
                    $event: evt
                });
            });
        });
    };
}]);


app.directive('kendoUpload', function (msgModalN) {
    return {
        require: '?ngModel',
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs, ngModel) {
            var opt = angular.extend({
                select: "点击更改Logo",
                saveUrl: "",
                success: function (e) {
                },
                max_size: 100     // 100kb
            }, scope.$eval(attrs.kendoUpload));
            var up_obj = $(element).find('input').kendoUpload({
                localization: {
                    select: opt.select,
                    remove: '删除',//删除按钮的tips
                    headerStatusUploading: '开始上传',
                    // headerStatusUploaded: "Logo更改成功"
                },
                async: {
                    autoUpload: true,
                    saveUrl: opt.saveUrl, //文件上传对应的接口
                    removeUrl: '' //文件删除对应的接口
                },
                upload: function (e) {
                    var xhr = e.XMLHttpRequest;
                    if (!e.data) {
                        e.data = {};
                    }
                    var data = {'csrfmiddlewaretoken': $("#csrf").val()};
                    $.extend(true, e.data, data);
                },
                multiple: false,
                success: opt.success,
                select: function (e) {
                    if (e.files[0].size > opt.max_size * 1024) {
                        msgModalN.open('文件大小不能超过' + opt.max_size + 'KB！', 'error');
                        up_obj.cancel();
                    }
                }
            });
        }
    }
});

app.directive('cwTopMenu', function ($compile) {
    return {
        require: '?ngModel',
        template: '<div id="cwTopMenu">\n' +
            '    <ul class="cw-top-nav" ng-repeat="m in menuList">\n' +
            '        <li class="cw-top-menu"\n' +
            '            ng-mouseover="showMenuChild($event)"\n' +
            '            ng-mouseleave="hideMenuChild($event)"\n' +
            '        >\n' +
            '            <div class="menu"  ng-class="menuIndex==$index ?\'menu-active\':\'\'">\n' +
            '                <a ng-class="menuIndex==$index ?\'a-active\':\'\'" ng-href="{{ m.url }}" ng-click="targetPage($index, m)" ng-bind="m.displayName"></a>\n' +
            '                <b ng-if="m.children" class="fa fa-angle-down fa-lg" ></b>' +
            '            </div>' +
            '            <ul class="top-nav-child hide-menu-child" ng-if="m.children"  ng-click="targetChildPage($index, m)" >' +
            '                <li class="top-menu-child" ng-repeat="c in m.children"' +
            '                    ng-mouseover="showMenuChild3($event)"' +
            '                    ng-mouseleave="hideMenuChild3($event)"' +
            '                    >' +
            '                    <a style="float: left" ng-href="{{ c.url }}" ng-bind="c.displayName"></a><div style="float: left;margin: 12px 0 0 -22px" class="fa fa-angle-down fa-lg" ng-if="c.children"></div> ' +
            '                    <ul class="top-nav-child3 hide-menu-child" ng-if="c.children">' +
            '                       <li class="top-menu-child3" ng-repeat="c3 in c.children">' +
            '                    <a ng-href="{{ c3.url }}" ng-bind="c3.displayName"></a>' +
            '                       </li>' +
            '                    </ul>' +
            '                </li>\n' +
            '            </ul>\n' +
            '        </li>\n' +
            '    </ul>\n' +
            '</div>',
        restrict: 'EA',
        replace: true,
        link: function ($scope, element, attrs, ngModel) {
            $scope.topMenuOptions = $scope.$eval(attrs.cwTopMenu);
            $scope.menuList = $scope.topMenuOptions.data;
            $scope.menuIndex = 0;
            $scope.target = '';
            var host = window.location.href;
            var index = host.lastIndexOf('#/');
            var target = '#' + host.substring(index + 1, host.length).split('?')[0].split('#')[0];
            for (var i = 0; i < $scope.menuList.length; i++) {
                if ($scope.menuList[i].url == target) {
                    $scope.menuIndex = i;
                    $scope.target = target;
                }
                var children = $scope.menuList[i].children
                if (children) {
                    for (var m = 0; m < children.length; m++) {
                        if (children[m].url == target) {
                            $scope.menuIndex = i;
                            $scope.target = target;
                        }
                    }
                }
            }
            $scope.sys_menuList = [];

            $scope.targetPage = function (index, m, $event) {
                $scope.target = m.url;
                $scope.menuIndex = index;
                $scope.setSystemPathByMenuClick();

            };
            $scope.targetChildPage = function (index) {
                $scope.menuIndex = index;
                $scope.setSystemPathByMenuClick();
            };
            $scope.is_child = false;
            $scope.showMenuChild = function ($event) {
                $($event.currentTarget).children('.top-nav-child').removeClass('hide-menu-child');
            };
            $scope.hideMenuChild = function ($event) {
                $($event.currentTarget).children('.top-nav-child').addClass('hide-menu-child');
            };
            $scope.showMenuChild3 = function ($event) {
                $($event.currentTarget).children('.top-nav-child3').removeClass('hide-menu-child');
            };
            $scope.hideMenuChild3 = function ($event) {
                $($event.currentTarget).children('.top-nav-child3').addClass('hide-menu-child');
            };
            $scope.setSystemPathByMenuClick = function () {
                var host = window.location.href;
                var index = host.lastIndexOf('#/');
                console.log(host);
                var target = '#' + host.substring(index + 1, host.length).split('?')[0].split('#')[0];
            };
            $scope.setSystemPathByMenuClick();
        }
    }
});

