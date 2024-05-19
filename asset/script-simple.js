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
    drawnItems.addLayer(layer);
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

//var orderTable = document.getElementById("orderTable");
var markers = {}; // Store markers by order ID
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
$('#dg').datagrid({
    onClickRow: function (index, row) {
        // Handle row click event
        console.log('Row clicked:', row);
    }
});
orders.forEach((order) => {
    // var row = document.createElement("tr");
    // row.setAttribute("id", "order-" + order.id);
    // row.innerHTML = `
    //     <td>${order.id}</td>
    //     <td>${order.priority}</td>
    //     <td>${order.location}</td>
    //     <td>${order.address.join(", ")}</td>
    //     <td>${order.duration}</td>
    //     <td>${order.driver}</td>
    //     <td>${order.stopNumber}</td>
    // `;
    // orderTable.appendChild(row);

    // Add marker to the map
    var marker = L.marker(order.address, {
        icon: createNumberedMarker(order.stopNumber),
    })
        .addTo(map)
        .on("click", clickZoom);

    marker.bindPopup(
        `<b>Order ID:</b> ${order.id}<br><b>Location:</b> ${order.location}<br><b>Driver:</b> ${order.driver}`
    );
    function clickZoom(e) {
        map.setView(e.target.getLatLng(), zoom);

        //setActive(e.target._leaflet_id);
    }
    marker.on("mouseover", function (e) {
        this.openPopup();
    });

    marker.on("mouseout", function (e) {
        this.closePopup();
    });
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

function highlightMarker(orderId) {
    // Reset all markers to default
    Object.values(markers).forEach((marker) => {
        const orderId = Object.keys(markers).find(id => markers[id] === marker);
        const order = orders.find(order => order.id == orderId);
        marker.setIcon(createNumberedMarker(order.stopNumber));
    });

    // Highlight the selected marker
    const selectedOrder = orders.find(order => order.id == orderId);
    markers[orderId].setIcon(createNumberedMarker(selectedOrder.stopNumber, true));
}

// Draw polyline between markers
L.polyline(latlngs, { color: "blue" }).addTo(map);
