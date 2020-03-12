controllers.controller("site", ["$scope", function ($scope) {
    $scope.menuList = [
        {
            id: 1, type: 'fa', displayName: "首页", iconClass: "fa fa-home fa-lg", url: "#/home", children: []
        },
        {
            id: 2, type: 'fa', displayName: "申请管理", iconClass: "fa fa fa-bookmark-o fa-lg",
            children: [
                {id: 3, displayName: "未完申请", url: "#/applyList"},
                {id: 4, displayName: "已完申请", url: "#/completedApply"}
            ]
        },
        {
            id: 5, type: 'fa', displayName: "IP管理", iconClass: "fa fa-align-left fa-lg fa18",
            children: [
                {id: 6, displayName: "资源池管理", url: "#/ipPoolList"},
                {id: 7, displayName: "已分配IP", url: "#/segmentManagement"},
                {id: 8, displayName: "保留IP", url: "#/keepManagement"},
                {id: 9, displayName: "IP查询", url: "#/assignationList"}
            ]
        },
        {
            id: 10, type: 'fa', displayName: "系统管理", iconClass: "fa fa-cog fa-lg",
            children: [
                {id: 11, displayName: "系统设置", url: "#/sysManagement"},
                {id: 14, displayName: "自定义属性", url: "#/customAttr"},
                {id: 16, displayName: "模型管理", url: "#/moduleAssociation"},
                {id: 17, displayName: "同步记录", url: "#/moduleSyncRecord"},
                {id: 13, displayName: "邮箱管理", url: "#/mailManagement"},
                {id: 15, displayName: "操作日志", url: "#/operationLog"}
            ]
        }
    ];

    $scope.menuOption = {
        data: 'menuList',
        locationPlaceHolder: '#locationPlaceHolder',
        adaptBodyHeight: CWApp.HeaderHeight + CWApp.FooterHeight
    };

    $scope.topList = [
        {
            displayName: "IP 申请", url: "#/ipApply"
        },
        {
            displayName: "IP 检测", url: "#/ipDetection"
        },
        {
            displayName: "我的IP", url: "#/myIP"
        }
    ];

    $scope.topMenu = {
        data: $scope.topList
    };


    $scope.goToUrl = function (page) {
        window.location.href = "#/" + page;
    };

    $scope.isVisit = function (url) {
        var urls = window.location.href.split("#/");
        if (urls.length == 1) {
            if (url == "ipApply") {
                return true;
            }
        }
        if (urls[1] == url) {
            return true;
        }
        return false;
    };

    $scope.logo_img = site_url + "show_logo/";

    $scope.goToUser = function () {
        window.open(site_url + "user_page/");
    };
}]);