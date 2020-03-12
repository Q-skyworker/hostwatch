(function (window) {
    var leftMenu = angular.module('cwLeftMenu', ['leftMenuService']);
    var leftMenuService = angular.module('leftMenuService', []);
    var setMenuOpen = function (menus, parent, selectedMenu) {
        for (var i = 0; i < menus.length; i++) {
            if (selectedMenu.id === menus[i].id) {
                if (parent)
                    parent.display = "block";
                menus[i].display = "block";
                return "block"
            }
            if (menus[i].children != undefined && menus[i].children.length > 0) {
                var display = setMenuOpen(menus[i].children, menus[i], selectedMenu);
                if (display == "block") {
                    if (parent) {
                        parent.display = "block";
                    }
                    break;
                }
            } else {
                if (selectedMenu.id === menus[i].id || selectedMenu.url === menus[i].url) {
                    if (parent) {
                        parent.display = "block";
                    }
                    menus[i].display = "block";
                    return "block";
                }
            }
        }
    };

    var setNon = function (menus, t = '') {
        // if (menus.children) {
        //     if (menus.children && menus.children.length) {
        for (var i = 0; i < menus.length; i++) {
            // if(menus[i].children){
            if (t.type == 'fa') {
                menus[i].display = "none";
            } else {
                if (menus[i].children && menus[i].children.length > 0) {
                    setNon(menus[i].children, menus[i])
                }
            }
            // menus[i].display = "none";
            // }
            // if (menus[i].children && menus[i].children.length > 0) {
            //     setNon(menus[i].children)
            // }
        }
        // }

        // }

        // for (var i = 0; i < menus.length; i++) {
        //     if (menus[i].children && menus[i].children.length > 0) {
        //         menus[i].display = 'none'
        //         for(var j = 0; j < menus[i].children.length; j++){
        //             if(menus[i].children[j].children && menus[i].children[j].children.length > 0){
        //                 menus[i].children[j].display = 'none'
        //             }else{
        //                 // menus[i].display = 'block'
        //             }
        //
        //         }
        //     }else{
        //         menus[i].display = "block";
        //     }
        // }

    }
    leftMenu.directive('cwLeftMenu', ['$rootScope', '$compile', 'leftMenuUtil', '$location',
        function ($rootScope, $compile, leftMenuUtil, $location) {
            return {
                restrict: 'EA',
                scope: true,
                replace: false,
                compile: function () {
                    return {
                        pre: function ($scope, iElement, iAttrs) {

                            var url = window.location.hash.split("?")[0];
                            if (url == "" || url == "#/") {
                                url = "#/home";
                            }
                            $scope.current_host = {value: url};
                            $scope.setCurrentHost = function (i) {

                                if (i.url != "" && i.url != undefined) {
                                    $scope.current_host.value = i.url;
                                }

                                if (i.children && i.children.length && i.display == 'block') {
                                    setNon($scope.dataForMyMenu, i);
                                } else {
                                    setNon($scope.dataForMyMenu, i);
                                    setMenuOpen($scope.dataForMyMenu, undefined, i);
                                }

                                $scope.dataForMyMenu = angular.copy($scope.dataForMyMenu);
                            };
                            var leftMenuOptions = angular.extend({
                                adaptBodyHeight: 0
                            }, $scope.$eval(iAttrs.cwLeftMenu));
                            $scope.menuBody = leftMenuUtil.BuildMenuHtml(leftMenuOptions);
                            iElement.append($compile($scope.menuBody)($scope));
                            var firstBind = false;
                            $scope.goHome = function () {
                                $location.path('/Home');
                            };
                            $scope.dataForMyMenu = [];
                            //设置导航
                            $scope.setSystemPathByMenuClick = function () {
                                if (leftMenuOptions.locationPlaceHolder) {
                                    var tempHtml = '<span><span class="fa fa-home fa-lg" ></span></span>';
                                    if (arguments[0] && $.isArray(arguments[0])) {
                                        for (var i = 0; i < arguments[0].length; i++) {
                                            tempHtml += ('&nbsp;&nbsp;<span class="fa fa-angle-right fa-lg"></span>&nbsp;&nbsp;<label style="margin-bottom: 0px;">' + arguments[0][i].displayName + '</label>');
                                        }
                                    }
                                    //else {
                                    //    for (var i = 0; i < arguments.length; i++) {
                                    //        tempHtml += ('&nbsp;&nbsp;<span class="fa fa-angle-right fa-lg"></span>&nbsp;&nbsp;<span>' + arguments[i] + '</span>');
                                    //    }
                                    //}
                                    $(leftMenuOptions.locationPlaceHolder).html($compile(tempHtml)($scope));

                                }
                            };
                            var getMenuNameStack = function (URLTag) {
                                var i, j, k, d, rowOne, rowTwo, rowThree, rowFour;
                                var temp = [];
                                for (i = 0; i < $scope.dataForMyMenu.length; i++) {
                                    rowOne = $scope.dataForMyMenu[i];
                                    if (rowOne.url == URLTag) {
                                        temp.push(rowOne);
                                        return temp;
                                    }
                                    for (j = 0; rowOne.children && j < rowOne.children.length; j++) {
                                        rowTwo = rowOne.children[j];
                                        if (rowTwo.url == URLTag) {
                                            temp.push(rowOne);
                                            temp.push(rowTwo);
                                            return temp;
                                        }
                                        for (k = 0; rowTwo.children && k < rowTwo.children.length; k++) {
                                            rowThree = rowTwo.children[k];
                                            if (rowThree.url == URLTag) {
                                                temp.push(rowOne);
                                                temp.push(rowTwo);
                                                temp.push(rowThree);
                                                return temp;
                                            }
                                            for (d = 0; rowThree.children && d < rowThree.children.length; d++) {
                                                rowFour = rowThree.children[d];
                                                if (rowFour.url == URLTag) {
                                                    temp.push(rowOne);
                                                    temp.push(rowTwo);
                                                    temp.push(rowThree);
                                                    temp.push(rowFour);
                                                    return temp;
                                                }
                                            }
                                        }
                                    }
                                }
                                return temp;
                            };
                            $scope.setSystemPathByURL = function () {
                                var URLTag = "#" + $location.path();
                                var menuNameStack = getMenuNameStack(URLTag);
                                $scope.setSystemPathByMenuClick(menuNameStack);
                            };
                            $rootScope.getParent = function (url) {
                                for (var m = 0; m < $scope.dataForMyMenu.length; m++) {
                                    if ($scope.dataForMyMenu[m].children.length) {
                                        for (var n = 0; n < $scope.dataForMyMenu[m].children.length; n++) {
                                            if ($scope.dataForMyMenu[m].children[n].url === url) {
                                                var current_obj = $scope.dataForMyMenu[m].children[n]
                                                var parent_obj = $scope.dataForMyMenu[m]
                                            }
                                        }
                                    }
                                }
                                $scope.setCurrentHost(parent_obj)
                                $scope.setCurrentHost(current_obj)
                            }

                            var data;
                            var dataWatcher = function (a) {
                                if (a != undefined) {
                                    firstBind = true;
                                    data = a;
                                    $scope.dataForMyMenu = [];
                                    for (var i = 0; i < data.length; i++) {
                                        $scope.dataForMyMenu.push(data[i]);
                                    }
                                    setNon($scope.dataForMyMenu);
                                    setMenuOpen($scope.dataForMyMenu, undefined, {'url': url});
                                    $scope.setSystemPathByURL();
                                }
                            };

                            $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                                $scope.setSystemPathByURL();
                            });

                            $scope.$on('$destroy', $scope.$parent.$watch(leftMenuOptions.data, dataWatcher));
                            $scope.$on('$destroy', $scope.$parent.$watch(leftMenuOptions.data + '.length', function (a) {
                                if (!firstBind && a != undefined) {
                                    for (var i = 0; i < data.length; i++) {
                                        $scope.dataForMyMenu.push(data[i]);
                                    }
                                    setNon($scope.dataForMyMenu);
                                    setMenuOpen($scope.dataForMyMenu, undefined, {url: url});
                                }
                                firstBind = false;
                            }));
                            leftMenuUtil.ApplyMenu();
                            var winHeight = 0;
                            if (window.innerHeight)
                                winHeight = window.innerHeight;
                            if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
                                winHeight = document.documentElement.clientHeight;
                            }
                            $("#sidebar_cwLeftMenu").css("min-height", (winHeight - leftMenuOptions.adaptBodyHeight) + 'px');

                        }
                    }
                }
            }
        }
    ]);

    leftMenuService.factory("leftMenuUtil", ['$templateCache', function ($templateCache) {
        var leftMenuUtil = {
            BuildMenuHtml: function (leftMenuOptions) {
                var menuBody = '<div class="sidebar" id="sidebar_cwLeftMenu">\
                                    <ul class="nav nav-list">\
					            	<li ng-repeat="rowOne in dataForMyMenu" >\
					            		<a ng-if="rowOne.children.length>0" href="{{rowOne.url}}"  ng-class="{\'dropdown-toggle\':rowOne.children.length>0,\'selected-menu-on\':rowOne.url == current_host.value || rowOne.display == \'block\'}" ng-click="setCurrentHost(rowOne)" >\
					            			<i class="{{rowOne.iconClass}}" style="margin-left: 9px;margin-right:10px;width: 20px; text-align: center;" ></i>\
					            			<span class="menu-text" style="margin-top:1px;"> {{rowOne.displayName}} </span>\
                                            <b ng-if="rowOne.children.length>0" class="fa fa-angle-down fa-lg menu-icon-showsubmenu rowOne" ></b>\
					            		</a>\
					            		\<a class="special_a" ng-if="rowOne.children.length==0" href="{{rowOne.url}}"  ng-class="{\'dropdown-toggle\':rowOne.children.length>0,\'selected-special-menu-on\':rowOne.url == current_host.value || rowOne.display == \'block\'}" ng-click="setCurrentHost(rowOne)" >\n\t\t\t\t\t            \t\t\t<i class="{{rowOne.iconClass}}" style="margin-left: 9px;margin-right:10px;width: 20px; text-align: center;" ></i>\n\t\t\t\t\t            \t\t\t<span class="menu-text" style="margin-top:1px;"> {{rowOne.displayName}} </span>\n                                            <b ng-if="rowOne.children.length>0" class="fa fa-angle-down fa-lg menu-icon-showsubmenu rowOne" ></b>\n\t\t\t\t\t            \t\t</a>\
                                        <ul class="submenu" ng-if="rowOne.children.length>0" style="display: {{rowOne.display}};">\
                                           <li ng-repeat="rowTwo in rowOne.children" >\
					            				<a style="font-size:14px;" href="{{rowTwo.url}}" ng-class="{\'dropdown-toggle\':rowTwo.children.length>0,\'selected-on\':rowTwo.url == current_host.value}" ng-click="setCurrentHost(rowTwo)">\
					            					<i class=""></i>\
                                                    {{rowTwo.displayName}}  \
                                                    <b ng-if="rowTwo.children.length>0" class="fa fa-angle-down fa-lg menu-icon-showsubmenu"></b>\
                                                </a>\
                                                <ul class="submenu" ng-if="rowTwo.children.length>0" style="display: {{rowTwo.display}};">\
                                                   <li ng-repeat="rowThree in rowTwo.children">\
                                                       <a style="font-size:14px;" href="{{rowThree.url}}" ng-class="{\'dropdown-toggle\':rowThree.children.length>0,\'selected-on\':rowThree.url == current_host.value}" ng-click="setCurrentHost(rowThree)">\
                                                          <i style="font-size:15px;margin-right:5px;width: 15px; text-align: center;vertical-align: middle;" class="{{rowThree.iconClass}}"></i>\
                                                          {{rowThree.displayName}}\
                                                          <b ng-if="rowThree.children.length>0" class="fa fa-angle-down fa-lg menu-icon-showsubmenu"></b> \
                                                       </a>\
                                                       <ul class="submenu" ng-if="rowThree.children.length>0">\
                                                           <li ng-repeat="rowFour in rowThree.children">\
                                                               <a href="{{rowFour.url}}">\
                                                                  <i class=""></i>\
                                                                  {{rowFour.displayName}}\
                                                               </a>\
                                                           </li>\
                                                        </ul>\
                                                   </li>\
                                                </ul>\
                                           </li>\
                                        </ul>\
					               </li>\
                              </ul> \
                              </div>';
                var tem = menuBody;
                return tem;

            },
            ApplyMenu: function () {
                if (!("ace" in window)) {
                    window.ace = {}
                }
                jQuery(function (a) {
                    window.ace.click_event = "click"
                });
                ace.handle_side_menu = function () {
                    //收缩
                    // var c = $("#sidebar_cwLeftMenu").hasClass("menu-min");
                    // $("#sidebar-collapse_cwLeftMenu").on(ace.click_event, function () {
                    //     c = $("#sidebar_cwLeftMenu").hasClass("menu-min");
                    //     ace.sidebar_collapsed(!c)
                    // });

                    var b = navigator.userAgent.match(/OS (5|6|7)(_\d)+ like Mac OS X/i);
                    $(".nav-list").on(ace.click_event, function (h) {
                        c = $("#sidebar_cwLeftMenu").hasClass("menu-min");
                        var g = $(h.target).closest("a");
                        if (!g || g.length == 0) {
                            return
                        }
                        if (!g.hasClass("dropdown-toggle")) {
                            if (b) {
                                document.location = g.attr("href");
                                return false
                            }
                            return
                        }
                        var f = g.next().get(0);
                        if (!$(f).is(":visible")) {
                            var d = $(f.parentNode).closest("ul");
                            if (c && d.hasClass("nav-list")) {
                                return
                            }
                            d.find("> .open > .submenu").each(function () {
                                if (this != f && !$(this.parentNode).hasClass("active")) {
                                    $(this).slideUp(200).parent().removeClass("open")
                                }
                            })
                        } else {
                        }
                        if (c && $(f.parentNode.parentNode).hasClass("nav-list")) {
                            return false
                        }
                        $(f).slideToggle(200).parent().toggleClass("open");
                        return false
                    })

                };
                jQuery(function (a) {
                    window.ace.sidebar_collapsed = function (c) {
                        c = c || false;
                        var e = document.getElementById("sidebar_cwLeftMenu");
                        var d = document.getElementById("sidebar-collapse_cwLeftMenu");
                        var leftArrow = 'fa fa-angle-double-left fa-lg hidden-menu-arrow';
                        var rightArrow = 'fa fa-angle-double-right fa-lg show-menu-arrow';

                        // if (c) {
                        //     $(".fa.fa-chevron-down.menu-icon-showsubmenu.rowOne").css('display', 'none');
                        //     $(".main-content").css('width', '96%');
                        //     $(".main-content").css('left', '4%');
                        //     $(e).addClass("menu-min");
                        //     $(e).addClass("menu-min-ul");
                        //     $(d).removeClass(leftArrow);
                        //     $(d).addClass(rightArrow);
                        // } else {
                        //     $(".fa.fa-chevron-down.menu-icon-showsubmenu.rowOne").css('display', 'block');
                        //     $(".main-content").css('width', '85%');
                        //     $(".main-content").css('left', '15%');
                        //     $(e).removeClass("menu-min");
                        //     $(e).removeClass("menu-min-ul");
                        //     $(d).removeClass(rightArrow);
                        //     $(d).addClass(leftArrow);
                        // }
                    };
                    ace.handle_side_menu();
                });

                jQuery(function (a) {
                    $('.nav-list>li').click(function () {
                        // $(this).children('a').css({background: '#217fc3', color: "#fff"})
                        $(this).siblings('li').children('a').css({background: '#fff', color: "#666"})
                    })
                })

            }
        };
        return leftMenuUtil;
    }])
}(window));