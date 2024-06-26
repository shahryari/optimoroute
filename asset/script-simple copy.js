$('#orders').datagrid({
    onClickRow: function (index, row) {
        highlightNumericMarker(row.id, orders, orderMarkers);
    }
});
$('input[type=checkbox]').change(function () {
    const customerId = $(this).attr('id');
    const isChecked = $(this).prop('checked');
    const index = customerId.split('customer').join('');
    if (isChecked) {
        showIcons(customerId);
        highlightMarker(customerMarkers[parseInt(index)], true)

    } else {
        hideIcons(customerId);
        highlightMarker(customerMarkers[parseInt(index)], false)

    }
});

function showIcons(customerId) {
    $(`#${customerId}`).siblings('.customer-lock, .customer-circle').css('visibility', 'visible');
    $(`#${customerId}`).siblings('.customer-info').find('.customer-info-detail').css('display', 'block');
    $("#orders").addClass("show-orders");
}

function hideIcons(customerId) {
    $(`#${customerId}`).siblings('.customer-lock, .customer-circle').css('visibility', 'hidden');
    $(`#${customerId}`).siblings('.customer-info').find('.customer-info-detail').css('display', 'none');
    $("#orders").removeClass("show-orders");
}
const saveButton = $('a[data-options*="iconCls:\'icon-save\'"]');
saveButton.on('click', function () {
    const routes = extractRoutes(route);
    routes.forEach((r, index) => {
        //addRouteToMap(r);
        const flattenedArray = flattenAndSwapCoordinates(r);
        const layers = new L.LayerGroup().addTo(map);

        addRoutingControl(flattenedArray);
        const polylineToRemove = polylines; // Assume polyline is the one you want to remove
        removePolyline(polylineToRemove);
    });
    finishRoute();
});
function isCoordinatePair(arr) {
    return Array.isArray(arr) && arr.length === 2 && arr.every(Number.isFinite);
}

function flattenAndSwapCoordinates(arr) {
    const result = [];

    function flatten(arr) {
        for (let item of arr) {
            if (isCoordinatePair(item)) {
                const coordinate = { lat: item[1], lng: item[0] };
                if (!result.some(existing => existing.lat === coordinate.lat && existing.lng === coordinate.lng)) {
                    result.push(coordinate);
                }
            } else if (Array.isArray(item)) {
                flatten(item);
            }
        }
    }

    flatten(arr);
    return result;
}

// -----------------------------------------------------
// Initialize the map
let config = {
    minZoom: 5,
    maxZoom: 18,
    fullscreenControl: false,
};
const zoom = 10;
const lat = 41.7151;
const lng = 44.8271;
const map = L.map("map", config).setView([lat, lng], zoom);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// --------------------------------------------------
// Notiflix options
Notiflix.Notify.init({
    width: "280px",
    position: "right-bottom",
    distance: "10px",
});
// --------------------------------------------------
// Draw polygon, circle, rectangle, polyline
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
map.addControl(new L.Control.Draw({
    edit: { featureGroup: drawnItems, poly: { allowIntersection: false }, edit: false },
    draw: { polyline: false, polygon: false, rectangle: true, circle: false, marker: false, circlemarker: false },
}));
L.Rectangle.include({
    contains: function (latLng) {
        return this.getBounds().contains(latLng);
    }
});

var markers = new L.LayerGroup().addTo(map);
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    //drawnItems.addLayer(layer);
    let tempWayPoints = []

    markers.eachLayer(function (marker) {
        var markerLatLng = marker.getLatLng();

        var isWaypoint = routingControls.some(control => {
            if (control.getWaypoints().some(wp => wp.latLng && wp.latLng.lat === markerLatLng.lat && wp.latLng.lng === markerLatLng.lng)) {
                // if (tempWayPoints.indexOf([markerLatLng.lng, markerLatLng.lat]) === -1) {
                //     tempWayPoints.push([markerLatLng.lng, markerLatLng.lat]);
                //     selectedMarkers.push(marker);
                // }

                return true;
            }
            return false;
        }
        );
        console.log("isWaypoint", isWaypoint)
        if (!isWaypoint) {
            if (layer.getBounds().contains(markerLatLng)) {
                if (marker.getElement()) {
                    marker.setIcon(createDefaultMarker(true));

                }
            } else {
                if (marker.getElement()) {
                    marker.setIcon(createDefaultMarker(false));
                }
            }
        }
        else {
            if (marker.getElement()) {
                marker.setIcon(createDefaultMarker(false));
            }
        }
    });

    routingControls.forEach((control, index) => {
        var waypoints = control.getWaypoints();
        var newWaypoints = waypoints.filter(function (waypoint) {
            var latLng = waypoint.latLng;
            if (latLng === null) return false;
            if (layer instanceof L.Rectangle) {

                return !layer.getBounds().contains(latLng);
            }

        });

        if (newWaypoints.length <= 1) {
            // Remove the routing and reset the marker
            control.setWaypoints([]);
            markers.eachLayer(function (marker) {
                var markerLatLng = marker.getLatLng();
                if (waypoints.some(wp => wp.latLng && wp.latLng.lat === markerLatLng.lat && wp.latLng.lng === markerLatLng.lng)) {
                    if (marker.getElement()) {
                        if (tempWayPoints.indexOf([markerLatLng.lng, markerLatLng.lat]) === -1) {
                            tempWayPoints.push([markerLatLng.lng, markerLatLng.lat]);
                            selectedMarkers.push(marker);
                        }

                        marker.setIcon(createDefaultMarker(false));
                    }
                }
            });
            //tempWayPoints.push([newWaypoints[0].latlng.lng, newWaypoints[0].latlng.lat]);
            //selectedMarkers.push(newWaypoints);
        } else {
            control.setWaypoints(newWaypoints);
        }
        geoJson.features[0].geometry.coordinates = tempWayPoints;
        drawPolylineFromGeoJSON(geoJson)
        tempWayPoints = [];
        selectedMarkers = [];
    });
});

map.on(L.Draw.Event.DELETED, function (event) {
    event.layers.eachLayer(function (layer) {
        if (layer instanceof L.Polyline) {
            selectedMarkers = selectedMarkers.filter(marker => {
                const markerLatLng = marker.getLatLng();
                const isInRoute = isInRouteFunc(markerLatLng, route);
                if (!isInRoute) {
                    marker.setIcon(createDefaultMarker(false)); // Reset to default icon
                }
                return isInRoute;
            });

            // Update the icons for the remaining selected markers
            const routes = extractRoutes(route);
            routes.forEach((r, index) => {
                const selectedMarkersForRoute = selectedMarkers.filter((marker, i) => {
                    const markerLatLng = marker.getLatLng();
                    const t = isInRouteFunc(markerLatLng, r);
                    return t;
                });

                resetNumbersForRoute(selectedMarkersForRoute, index);
            });

            // Update the GeoJSON coordinates if necessary
            if (route.length > 0) {
                geoJson.features[0].geometry.coordinates = route[route.length - 1];
            }
        }
    });
});

function isInRouteFunc(markerLatLng, line) {
    return line.some(routePoint => {
        const isInPoint = routePoint.some(rp => {
            return rp[1] === markerLatLng.lat && rp[0] === markerLatLng.lng;
        });
        return isInPoint;
    });
}

function resetNumbersForRoute(selectedMarkers, routeIndex) {
    selectedMarkers.forEach((marker, index) => {
        // Reset the number for each marker based on routeIndex
        marker.setIcon(createNumberedMarker(index + 1, false));
    });
}
function finishRoute() {
    geoJson.features[0].geometry.coordinates = [];
    selectedMarkers = [];
    route = [];
}
// --------------------------------------------------
// Function to add a routing control
function addRoutingControl(waypoints) {

    var control = L.Routing.control({
        waypoints: waypoints,
        show: false,
        containerClassName: 'd-none',
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: {
            styles: [{ color: '#2e2d2d', opacity: 0.8, weight: 9 }, { color: 'white', opacity: 1, weight: 1, dashArray: '5, 5' }]
        },
        createMarker: function (i, waypoint, n) {
            // Custom marker icon
            return L.marker(waypoint.latLng, {
                draggable: false,
                icon: createNumberedMarker(i + 1) // Use a custom marker icon
            }).addTo(markers);
        }
    }).addTo(map);
    control.on('routesfound', function (e) {
        var routes = e.routes;
        var distancesDiv = document.getElementById('distance');

        // Clear previous distances
        distancesDiv.innerHTML = 'Distances:';

        // Calculate and display distances between waypoints
        for (var i = 0; i < routes.length; i++) {
            var leg = routes[i];
            var distance = (leg.summary.totalDistance / 1000).toFixed(2) + ' km'; // Distance in kilometers
            var segmentInfo = document.createElement('div');
            segmentInfo.className = 'distance-segment';
            segmentInfo.innerHTML = 'Segment ' + (i + 1) + ': ' + distance;
            distancesDiv.appendChild(segmentInfo);
        }
    });
    // Add the control to the array
    routingControls.push(control);
}

// --------------------------------------------------

// Function to create the route
function createRoute(waypoints) {
    if (waypoints) {
        control.setWaypoints(waypoints);
    } else {
        control.setWaypoints([]);
    }
}

// --------------------------------------------------
// Tab functionality
const tabs = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab");

tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
        tabs.forEach((t) => t.classList.remove("active"));
        tabContents.forEach((tc) => tc.classList.remove("active"));
        this.classList.add("active");
        document.getElementById(this.dataset.tab).classList.add("active");
    });
});

let latlngs = [];
let orderMarkers = [];
let customerMarkers = {};
let selectedMarkers = []; // Store selected markers
let polyline = null; // Store the polyline
let route = [];
let polylines = [];
let drownRoutes = []
var routingControls = [];
var geoJson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "type": "polyline"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                ]
            }
        }
    ]
};
// Orders data
var orders = [
    { id: 1001, priority: "Medium", location: "East Point", address: [41.698629, 44.887356], duration: "30 min", driver: "Driver 001", stopNumber: 1, },
    { id: 1002, priority: "Medium", location: "Tbilisi Mall", address: [41.870564, 44.77256], duration: "45 min", driver: "Driver 001", stopNumber: 3, },
    { id: 1003, priority: "Medium", location: "City Mall", address: [41.726045, 44.737074], duration: "5 min", driver: "Driver 001", stopNumber: 4, },
    { id: 1004, priority: "Medium", location: "East Point", address: [41.59862, 44.887356], duration: "40 min", driver: "Driver 001", stopNumber: 2, },
];
var customers = [
    { id: 001, location: "East Point", address: [41.398629, 44.887356], duration: "30 min" },
    { id: 002, location: "Tbilisi Mall", address: [41.270564, 44.77256], duration: "45 min" },
    { id: 003, location: "City Mall", address: [41.126045, 44.737074], duration: "5 min" },
    { id: 004, location: "Shop center", address: [41.298629, 44.887356], duration: "40 min" },
    { id: 005, location: "Mall center", address: [41.128629, 44.447356], duration: "40 min" },
];

// Initialize the datagrid
$('#customersTable').datagrid({
    columns: [[
        { field: 'id', title: 'ID', sortable: true },
        { field: 'location', title: 'Location' },
        { field: 'address', title: 'Address' },
        { field: 'duration', title: 'Duration' }
    ]],

    onCheck: function (index, row) {
        showIcons(index);
        var rows = $('#customersTable').datagrid('getSelected');
        highlightMarker(customerMarkers[index + 1], true);
    },

    onUnselect: function (index, row) {
        hideIcons(index);
        highlightMarker(customerMarkers[index + 1], false);
    }
});

// Load data into the datagrid
$('#customersTable').datagrid('loadData', customers);
//var orderTable = document.getElementById("orderTable");
// Store markers by order ID
$('#orderTable').datagrid({
    url: 'datagrid_data1.json',
    method: 'get',
    columns: [[
        { field: 'orderId', title: 'Order ID', width: 100 },
        { field: 'priority', title: 'Priority', width: 100 },
        { field: 'location', title: 'Location', width: 150 },
        { field: 'address', title: 'Address', width: 150 },
        { field: 'duration', title: 'Duration', width: 100 },
        { field: 'driver', title: 'Driver', width: 100 },
        { field: 'stopNumber', title: 'Stop Number', width: 80 }
    ]]
});

function countDefinedElements(arr) {
    return arr.filter(element => element !== undefined).length;
}

function findArrayWithMostDefinedElements(arrays) {
    return arrays.reduce((biggest, current) => {
        return countDefinedElements(current) > countDefinedElements(biggest) ? current : biggest;
    }, []);
}
function findIndexOfLongestArray(arrays) {
    let maxLength = -1;
    let index = -1;

    arrays.forEach((arr, i) => {
        if (arr.length > maxLength) {
            maxLength = arr.length;
            index = i;
        }
    });

    return index;
}
//Function to handle marker click
function onMarkerClick(e) {
    $('#map').css('cursor', 'not-allowed');
    var marker = e.target;
    let maxRouteIndex = 0
    // if (route.length > 0) {
    //     let routesEx = extractRoutes(route);
    //     maxRouteIndex = findIndexOfLongestArray(routesEx);
    //     route[maxRouteIndex].push([marker.latLng.lat, marker.latl])
    // }


    // Toggle marker selection state
    if (selectedMarkers.includes(marker)) return;

    // Add marker to selectedMarkers array
    selectedMarkers.push(marker);
    // Coordinates to add
    var newCoordinates = [
        [e.latlng.lng, e.latlng.lat]
    ];

    if (geoJson.features[0].geometry.coordinates.length >= 2) {
        geoJson.features[0].geometry.coordinates = geoJson.features[0].geometry.coordinates.slice(-1)

    }
    geoJson.features[0].geometry.coordinates.push(...newCoordinates)

    //setGeojsonToMap(geoJson);
    //updatePolyline(); // Update the polyline
    drawPolylineFromGeoJSON(geoJson);
}


function drawPolylineFromGeoJSON(geojson) {
    if (selectedMarkers.length >= 2) {
        if (polyline != null) {
            if (map.hasLayer(polyline))
                map.removeLayer(polyline);
        }
        const feature = L.geoJSON(geojson, {
            style: function (feature) {
                return {
                    color: "#3388ff",
                    weight: 4,
                    opacity: 0.5
                };
            },
            pointToLayer: (feature, latlng) => {
                if (feature.properties.type === "circle") {
                    return new L.circle(latlng, {
                        radius: feature.properties.radius,
                    });
                } else if (feature.properties.type === "circlemarker") {
                    return new L.circleMarker(latlng, {
                        radius: 10,
                    });
                } else {
                    return new L.Marker(latlng, { icon: createDefaultMarker(false) }).addTo(markers);
                }
            },
            onEachFeature: function (feature, layer) {
                drawnItems.addLayer(layer);
                const coordinates = feature.geometry.coordinates.toString();
                route.push(feature.geometry.coordinates);
                drownRoutes.push(feature.geometry.coordinates);
                const result = coordinates.match(/[^,]+,[^,]+/g);
                layer.bindPopup(
                    "<span>Coordinates:<br>" + result.join("<br>") + "</span>"
                );
                layer.on('remove', function (e) {
                    //if (isBetweenPoints(e.target.getLatLngs().map(coord => `${coord.lng},${coord.lat}`), route.map(coord => coord.map(m => m.toString()).toString()))) {
                    const indexToRemove = route.map(coord => coord.map(m => m.toString()).toString()).indexOf(e.target.getLatLngs().map(coord => `${coord.lng},${coord.lat}`).toString());
                    if (indexToRemove !== -1) {
                        route.splice(indexToRemove, 1);
                    }
                    // }
                    // else {

                    // }

                });
            },
        }).addTo(map);

        //map.flyToBounds(feature.getBounds());
        polylines.push(feature);
        // Create polyline from GeoJSON coordinates
        if (geojson.features[0].geometry.type === "LineString") {
            const coordinates = geojson.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            //polyline = L.polyline(coordinates, { color: 'red' }).addTo(map);

        }
        selectedMarkers.forEach(function (marker, index) {
            marker.setIcon(createNumberedMarker(index + 1, false));
        });
    }
    else if (selectedMarkers.length == 1) {
        selectedMarkers.forEach(function (marker, index) {
            marker.setIcon(createNumberedMarker(index + 1, false));
        });
    }
    console.log(route)
}
function removePolyline(polylines) {
    polylines.forEach(function (polyline, index) {
        if (polyline != null && map.hasLayer(polyline)) {
            map.removeLayer(polyline);

            // const latlngs = polyline.getLatLngs();
            // const indexToRemove = route.findIndex(coords => {
            //     return coords.every((coord, i) => {
            //         return coord[0] === latlngs[i].lng && coord[1] === latlngs[i].lat;
            //     });
            // });

            // if (indexToRemove !== -1) {
            //     route.splice(indexToRemove, 1);
            //     polylineRoutes.splice(indexToRemove, 1);
            // }

            polylines = [];
        }
    });

}

function extractRoutes(r) {
    const routes = [];
    let currentRoute = [];
    let currentSegmentEnd = r[0][1];

    for (let i = 0; i < r.length; i++) {
        const nextSegmentStart = r[i][0];

        if (i > 0 && JSON.stringify(currentSegmentEnd) !== JSON.stringify(nextSegmentStart)) {
            // If the next segment doesn't start where the current segment ends,
            // consider it as the end of the current route
            routes.push(currentRoute);
            currentRoute = [];
        }

        currentRoute.push(r[i]);
        currentSegmentEnd = r[i][1];
    }

    // Push the last route if it's not empty
    if (currentRoute.length > 0) {
        routes.push(currentRoute);
    }

    return routes;
}


function isBetweenPoints(point, line) {

    return line[0] == point
        || line[line.length - 1] == point;
}

customers.forEach((customer) => {
    const popupContent = `
                <div class="popup-header">Customer ID: ${customer.id}</div>
                <div class="popup-row"><span class="popup-label">Location:</span> ${customer.location}</div>
                <div class="popup-row"><span class="popup-label">Duration:</span> ${customer.duration}</div>
            `;
    var marker = L.marker(customer.address, { icon: createDefaultMarker(false) }).addTo(markers);

    marker.bindPopup(popupContent, { closeButton: false })
        .on('click', onMarkerClick);

    marker.on("mouseover", function (e) {
        this.openPopup();
    });

    // marker.on("mouseout", function (e) {
    //     this.closePopup();
    // });
    customerMarkers[customer.id] = marker; // Store marker by order ID
    // Add the coordinates to the latlngs array
    //latlngs.push(customer.address);
});

orders.forEach((order) => {
    const popupContent = `
                <div class="popup-header">Order ID: ${order.id}</div>
                <div class="popup-row"><span class="popup-label">Location:</span> ${order.location}</div>
                <div class="popup-row"><span class="popup-label">Driver:</span> ${order.driver}</div>
                <div class="popup-row"><span class="popup-label">Duration:</span> ${order.duration}</div>
                <div class="popup-row"><span class="popup-label">Priority:</span> ${order.priority}</div>
            `;
    var marker = L.marker(order.address, {
        icon: createNumberedMarker(order.stopNumber),
    }).addTo(markers);

    marker.bindPopup(popupContent, { closeButton: false });

    function clickZoom(e) {
        map.setView([e.latlng.lat, e.latlng.lng], zoom);

        //setActive(e.target._leaflet_id);
    }
    marker.on("mouseover", function (e) {
        this.openPopup();
    });

    // marker.on("mouseout", function (e) {
    //     this.closePopup();
    // });
    function setActive(markerId) {
        // Reset all markers to default
        Object.values(orderMarkers).forEach((marker) => {
            const orderId = Object.keys(orderMarkers).find(id => orderMarkers[id] === marker);
            const order = orders.find(order => order.id == orderId);
            marker.setIcon(createNumberedMarker(order.stopNumber));
        });

        // Highlight the selected marker
        const selectedOrder = orders.find(order => order.id == markerId);
        orderMarkers[markerId].setIcon(createNumberedMarker(selectedOrder.stopNumber, true));
    }

    orderMarkers[order.id] = marker; // Store marker by order ID

    // row.addEventListener("click", function () {
    //     // Highlight selected marker
    //     highlightMarker(order.id);
    //     // Pan map to the marker
    //     map.setView(order.address, zoom);

    // });

    // Add the coordinates to the latlngs array
    latlngs.push(order.address);
});

// Add a custom icon for numbered markers
function createNumberedMarker(number, isActive = false) {
    return L.divIcon({
        className: "custom-icon",
        html: `<div class='content-icon'><i class='fa-solid fa-location-pin icon-p ${isActive ? 'icon-active' : ''}'></i><i class='fa-solid fa-location-pin icon-p '><span class='icon-number'>${number}</span></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });
}
function createDefaultMarker(isActive = false) {
    return L.divIcon({
        className: "custom-icon",
        html: `<div class='content-icon'><i class='fa-solid fa-location-dot icon-p ${isActive ? 'icon-active' : ''}'></i><i class='fa-solid fa-location-dot icon-p '></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });
}
function highlightNumericMarker(id, dataCollection, markerCollection) {
    // Reset all markers to default
    Object.values(markerCollection).forEach((marker) => {
        const orderId = Object.keys(markerCollection).find(id => markerCollection[id] === marker);
        const order = dataCollection.find(order => order.id == orderId);
        marker.setIcon(createNumberedMarker(order.stopNumber));
    });

    // Highlight the selected marker
    const selectedOrder = dataCollection.find(order => order.id == id);
    markerCollection[id].setIcon(createNumberedMarker(selectedOrder.stopNumber, true));
    // Center the map on the selected marker
    map.setView(markerCollection[id].getLatLng(), zoom, {
        animate: true,
        pan: { duration: 1 }
    });
}

function highlightMarker(markerCollection, isActive) {

    markers.eachLayer(function (m) {
        var selectedRows = $('#customersTable').datagrid('getSelections');
        if (selectedRows) {
            var isMarkerInSelectedRows = selectedRows.some(selectedRow => {
                return m.getLatLng().lat === selectedRow.address[0] && m.getLatLng().lng === selectedRow.address[1];
            });

            // If the marker is not in any selected row, reset its icon
            if (!isMarkerInSelectedRows && m.getElement()) {
                m.setIcon(createDefaultMarker(false));
            }
        }
    });


    var markerElement = markerCollection.getElement().querySelectorAll('.content-icon .icon-p');
    // var isActive = markerElement[0].classList.contains("icon-active");

    if (!isActive) {
        markerElement[0].classList.remove('icon-active'); // Remove active-marker class
    } else {
        markerElement[0].classList.add('icon-active'); // Add active-marker class
    }

    // Center the map on the selected marker
    map.setView(markerCollection.getLatLng(), map.getZoom(), {
        animate: true,
        pan: { duration: 1 }
    });
}


// Draw polyline between markers
//L.polyline(latlngs, { color: "blue" }).addTo(map);
addRoutingControl(latlngs);
// const route1Waypoints = [
//     L.latLng(44.557356, 41.118629), // Example waypoints, replace with your actual waypoints
//     L.latLng(44.667356, 41.228629)
// ];
// const route2Waypoints = [
//     L.latLng(51.55, -0.1),
//     L.latLng(51.54, -0.11)
// ];

// // Add multiple routes to the map
// addRouteToMap(route1Waypoints);
// addRouteToMap(route2Waypoints);