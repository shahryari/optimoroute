$('#dg').datagrid({
    onClickRow: function (index, row) {
        highlightNumericMarker(row.id, orders, markers);
    }
});
$('input[type=checkbox]').change(function () {
    const customerId = $(this).attr('id');
    const isChecked = $(this).prop('checked');
    const index = customerId.split('customer').join('');
    if (isChecked) {
        showIcons(customerId);
        highlightMarker(customers[index].id, customers, customerMarkers)

    } else {
        hideIcons(customerId);
        highlightMarker(customers[index].id, customers, customerMarkers)

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
// Initialize the map
let config = {
    minZoom: 5,
    maxZoom: 18,
    fullscreenControl: true,
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
// Add buttons to map
const customControl = L.Control.extend({
    options: {
        position: "topright",
    },
    onAdd: function () {
        const array = [];
        const container = L.DomUtil.create(
            "div",
            "leaflet-control leaflet-action-button"
        );
        array.forEach((item) => {
            const button = L.DomUtil.create("a");
            button.href = "#";
            button.setAttribute("role", "button");
            button.title = item.title;
            button.innerHTML = item.html;
            button.className += item.className;
            container.appendChild(button);
        });
        return container;
    },
});
map.addControl(new customControl());

// Draw polygon, circle, rectangle, polyline
let drawnItems = L.featureGroup().addTo(map);
map.addControl(
    new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            poly: {
                allowIntersection: false,
            },
        },
        draw: {
            polygon: {
                allowIntersection: false,
                showArea: true,
            },
        },
    })
);

map.on(L.Draw.Event.CREATED, function (event) {
    let layer = event.layer;
    let feature = (layer.feature = layer.feature || {});
    let type = event.layerType;
    feature.type = feature.type || "Feature";
    let props = (feature.properties = feature.properties || {});
    props.type = type;
    if (type === "circle") {
        props.radius = layer.getRadius();
    }
    // if (layer instanceof L.Marker) {
    //     marker = layer;
    // }

    // if (marker && !selectedMarkers.includes(marker)) {
    //     selectedMarkers.push(marker); // Add marker to selectedMarkers array
    //     updatePolyline(); // Update the polyline
    // }
    drawnItems.addLayer(layer);
});
map.on(L.Draw.Event.DRAWVERTEX, function (event) {
    var marker = event.target;
    if (!selectedMarkers.includes(marker)) {
        selectedMarkers.push(marker); // Add marker to selectedMarkers array
        updatePolyline(); // Update the polyline
    }
});

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

var latlngs = [];
var markers = {};
var customerMarkers = {};
var selectedMarkers = []; // Store selected markers
var polyline = null; // Store the polyline
// Orders data
var orders = [
    {
        id: 1001,
        priority: "Medium",
        location: "East Point",
        address: [41.698629, 44.887356],
        duration: "30 min",
        driver: "Driver 001",
        stopNumber: 1,
    },
    {
        id: 1002,
        priority: "Medium",
        location: "Tbilisi Mall",
        address: [41.870564, 44.77256],
        duration: "45 min",
        driver: "Driver 001",
        stopNumber: 3,
    },
    {
        id: 1003,
        priority: "Medium",
        location: "City Mall",
        address: [41.726045, 44.737074],
        duration: "5 min",
        driver: "Driver 001",
        stopNumber: 4,
    },
    {
        id: 1004,
        priority: "Medium",
        location: "East Point",
        address: [41.698629, 44.887356],
        duration: "40 min",
        driver: "Driver 001",
        stopNumber: 2,
    },
];
var customers = [
    { id: 001, location: "East Point", address: [41.398629, 44.887356], duration: "30 min" },
    { id: 002, location: "Tbilisi Mall", address: [41.270564, 44.77256], duration: "45 min" },
    { id: 003, location: "City Mall", address: [41.126045, 44.737074], duration: "5 min" },
    { id: 004, location: "Shop center", address: [41.298629, 44.887356], duration: "40 min" },
];

// Initialize the datagrid
$('#customersTable').datagrid({
    columns: [[
        { field: 'id', title: 'ID', sortable: true },
        { field: 'location', title: 'Location' },
        { field: 'address', title: 'Address' },
        { field: 'duration', title: 'Duration' }
    ]],
    // Call this function when a row is checked
    onCheck: function (index, row) {
        showIcons(index);
        highlightMarker(customers[index].id, customers, customerMarkers);
    },
    // Call this function when a row is unchecked
    onUncheck: function (index, row) {
        hideIcons(index);
        highlightMarker(customers[index].id, customers, customerMarkers);
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

//Function to handle marker click
function onMarkerClick(e) {
    var marker = e.target;
    // var polylineGeoJSON = {
    //     "type": "Feature",
    //     "properties": {},
    //     "geometry": {
    //         "type": "LineString",
    //         "coordinates": [
    //             [marker.getLatLng().lng, marker.getLatLng().lat],
    //             [e.latlng.lng, e.latlng.lat]
    //         ]
    //     }
    // };

    // // Add the GeoJSON object to the map
    // L.geoJSON(polylineGeoJSON).addTo(map);
    if (!selectedMarkers.includes(marker)) {
        selectedMarkers.push(marker); // Add marker to selectedMarkers array
        updatePolyline(); // Update the polyline
    }
}


// Function to update polyline based on selected markers
function updatePolyline() {
    if (selectedMarkers.length >= 2) {
        // Remove existing polyline if any
        if (polyline != null) {
            if (map.hasLayer(polyline))
                map.removeLayer(polyline);
        }

        // Create new polyline
        var latLngs = selectedMarkers.map(function (marker) {
            return marker.getLatLng();
        });
        polyline = L.polyline(latLngs, { color: 'red' }).addTo(map);
        selectedMarkers.forEach(function (marker, index) {
            marker.setIcon(createNumberedMarker(index + 1, false));
        });
    }
    else if (selectedMarkers.length == 1) {
        selectedMarkers.forEach(function (marker, index) {
            marker.setIcon(createNumberedMarker(index + 1, false));
        });
    }
}

customers.forEach((customer) => {
    const popupContent = `
                <div class="popup-header">Customer ID: ${customer.id}</div>
                <div class="popup-row"><span class="popup-label">Location:</span> ${customer.location}</div>
                <div class="popup-row"><span class="popup-label">Duration:</span> ${customer.duration}</div>
            `;
    var marker = L.marker(customer.address).addTo(map);

    marker.bindPopup(popupContent, { closeButton: false })
        .on('click', onMarkerClick)
        ;

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
    }).addTo(map).on("click", clickZoom);

    marker.bindPopup(popupContent, { closeButton: false });

    function clickZoom(e) {
        map.setView(e.target.getLatLng(), zoom);

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
        Object.values(markers).forEach((marker) => {
            const orderId = Object.keys(markers).find(id => markers[id] === marker);
            const order = orders.find(order => order.id == orderId);
            marker.setIcon(createNumberedMarker(order.stopNumber));
        });

        // Highlight the selected marker
        const selectedOrder = orders.find(order => order.id == markerId);
        markers[markerId].setIcon(createNumberedMarker(selectedOrder.stopNumber, true));
    }

    markers[order.id] = marker; // Store marker by order ID

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
        className: isActive ? "custom-icon active-marker" : "custom-icon",
        html: `<div class='content-icon'><i class='fa-solid fa-location-pin'></i><span class='icon-number'>${number}</span></div>`,
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
L.polyline(latlngs, { color: "blue" }).addTo(map);
