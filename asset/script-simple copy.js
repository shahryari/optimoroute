

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
                    return new L.Marker(latlng);
                }
            },
            onEachFeature: function (feature, layer) {
                drawnItems.addLayer(layer);
                const coordinates = feature.geometry.coordinates.toString();
                route.push(feature.geometry.coordinates);
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
function drawRoutingFromSelectedMarkers(waypoints) {
    // Ensure there are at least two selected markers for routing
    if (waypoints.length >= 2) {
        // Extract coordinates of selected markers

        // Clear any existing routing controls
        clearRoutingControls();

        // Create routing control with selected waypoints
        var control = L.Routing.control({
            waypoints: waypoints,
            show: false,
            lineOptions: {
                styles: [{ color: '#2e2d2d', opacity: 0.8, weight: 9 }, { color: 'white', opacity: 1, weight: 1, dashArray: '5, 5' }]
            },
            createMarker: function (i, waypoint, n) {
                // Custom marker icon
                return L.marker(waypoint.latLng, {
                    draggable: false,
                    icon: createNumberedMarker(i + 1) // Use a custom marker icon
                });
            }
        }).addTo(map);
        control.on('routesfound', function (e) {
            var routes = e.routes;
            var distancesDiv = document.getElementById('distance1');

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
    } else {
        // Handle case when there are not enough markers selected for routing
        console.log("At least two markers are required for routing.");
    }
}

function clearRoutingControls() {
    // Check if routing control exists and remove it from the map
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
}


function isBetweenPoints(point, line) {

    return line[0] == point
        || line[line.length - 1] == point;
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

function highlightMarker(id, dataCollection, markerCollection) {
    // Highlight the selected marker
    var selectedItem = dataCollection.find(data => data.id == id);
    var markerElement = markerCollection[id].getElement();

    // Check if the marker already has the active-marker class
    var isActive = markerElement.classList.contains('active-marker');

    // Toggle the active-marker class
    if (isActive) {
        markerElement.classList.remove('active-marker'); // Remove active-marker class
    } else {
        markerElement.classList.add('active-marker'); // Add active-marker class
    }

    // Center the map on the selected marker
    map.setView(markerCollection[id].getLatLng(), map.getZoom(), {
        animate: true,
        pan: { duration: 1 }
    });
}


// Draw polyline between markers
//L.polyline(latlngs, { color: "blue" }).addTo(map);
addRouteToMap(latlngs);
const route1Waypoints = [
    L.latLng(44.557356, 41.118629), // Example waypoints, replace with your actual waypoints
    L.latLng(44.667356, 41.228629)
];
const route2Waypoints = [
    L.latLng(51.55, -0.1),
    L.latLng(51.54, -0.11)
];

// Add multiple routes to the map
addRouteToMap(route1Waypoints);
addRouteToMap(route2Waypoints);