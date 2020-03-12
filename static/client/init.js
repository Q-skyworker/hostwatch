var app = angular.module("myApp", ['myController', 'utilServices', 'myDirective', 'ui.bootstrap', 'ui.router', 'webApiService', 'ngGrid', 'cwLeftMenu']);
var controllers = angular.module("myController", []);
var directives = angular.module("myDirective", []);


app.config(["$stateProvider", "$urlRouterProvider", "$httpProvider",
    function ($stateProvider, $urlRouterProvider, $httpProvider) {
        $httpProvider.defaults.headers.post['X-CSRFToken'] = $("#csrf").val();
        $urlRouterProvider.otherwise("/home");//默认展示页面
        $stateProvider.state('home', {
            url: "/home",
            controller: "home",
            templateUrl: static_url + "client/views/home.html"
        })
            .state('applyList', {
                url: "/applyList",
                controller: "applyListCtrl",
                templateUrl: static_url + "client/views/applyManagement/applyList.html"
            })
            .state('completedApply', {
                url: "/completedApply",
                controller: "completedApplyCtrl",
                templateUrl: static_url + "client/views/applyManagement/completedApply.html"
            })
            .state('segmentManagement', {
                url: "/segmentManagement",
                controller: "segmentManagementCtrl",
                templateUrl: static_url + "client/views/ipManagement/segmentManagement.html"
            })
            .state('keepManagement', {
                url: "/keepManagement",
                controller: "keepManagementCtrl",
                templateUrl: static_url + "client/views/ipManagement/keepManagement.html"
            })
            .state('subjectsegMange', {
                url: "/subjectsegMange",
                controller: "subjectsegMangeCtrl",
                templateUrl: static_url + "client/views/ipManagement/subjectsegMange.html"
            })
            .state('assignationList', {
                url: "/assignationList",
                controller: "assignationListCtrl",
                templateUrl: static_url + "client/views/ipManagement/assignationList.html"
            })
            .state('sysManagement', {
                url: "/sysManagement",
                controller: "sysManagementCtrl",
                templateUrl: static_url + "client/views/sysManagement/sysManagement.html"
            })
            .state('mailManagement', {
                url: "/mailManagement",
                controller: "mailManagementCtrl",
                templateUrl: static_url + "client/views/sysManagement/mailManagement.html"
            })
            .state('customAttr', {
                url: "/customAttr",
                controller: "customAttrCtrl",
                templateUrl: static_url + "client/views/sysManagement/customAttr.html"
            })
            .state('operationLog', {
                url: "/operationLog",
                controller: "operationLogCtrl",
                templateUrl: static_url + "client/views/sysManagement/operationLog.html"
            })
            .state('ipPoolList', {
                url: "/ipPoolList",
                controller: "ipPoolList",
                templateUrl: static_url + "client/views/ipPoolManagement/ipPoolList.html"
            })
            .state('changeLogo', {
                url: "/changeLogo",
                controller: "changeLogoCtrl",
                templateUrl: static_url + "client/views/sysManagement/changeLogo.html"
            }).state('moduleAssociation', {
                url: "/moduleAssociation",
                controller: "moduleAssociationCtrl",
                templateUrl: static_url + "client/views/sysManagement/moduleAssociation.html"
            }).state('moduleSyncRecord', {
                url: "/moduleSyncRecord",
                controller: "moduleSyncRecordCtrl",
                templateUrl: static_url + "client/views/sysManagement/moduleSyncRecord.html"
            })
    }])
;
