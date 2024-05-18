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
// Nofiflix options

Notiflix.Notify.init({
    width: "280px",
    position: "right-bottom",
    distance: "10px",
});
// --------------------------------------------------
// add buttons to map

const customControl = L.Control.extend({
    // button position
    options: {
        position: "topright",
    },

    // method
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
            console.log(item.title);
            button.title = item.title;
            button.innerHTML = item.html;
            button.className += item.className;

            // add buttons to container;
            container.appendChild(button);
        });

        return container;
    },
});
map.addControl(new customControl());
// Drow polygon, circle, rectangle, polyline
// --------------------------------------------------

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
    if (type === "polygon" || type === "polyline") {
        // Update the number of points in the marker icon
        const latLngs = layer.getLatLngs();
        const pointCount = latLngs.length;
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
function createNumberedMarker(number) {
    return L.divIcon({
        className: "custom-icon",
        html:
            "<div class='content-icon'><i class='fa-solid fa-location-pin'></i><span class='icon-number'>" +
            order.stopNumber +
            "</span></div>",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });
}
function createNumberedMarker(number) {
    return L.divIcon({
        className: "numbered-marker",
        html: `<div class="numbered-marker-icon">${number}</div>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });
}
var orderTable = document.getElementById("orderTable");
var markers = {}; // Store markers by order ID
orders.forEach((order) => {
    var row = document.createElement("tr");
    row.setAttribute("id", "order-" + order.id);
    row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.priority}</td>
        <td>${order.location}</td>
        <td>${order.address.join(", ")}</td>
        <td>${order.duration}</td>
        <td>${order.driver}</td>
        <td>${order.stopNumber}</td>
    `;
    orderTable.appendChild(row);

    // Add marker to the map
    var numMarker = L.divIcon({
        className: "custom-icon",
        html:
            "<div class='content-icon'><i class='fa-solid fa-location-pin'></i><span class='icon-number'>" +
            order.stopNumber +
            "</span></div>",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });
    var marker = L.marker(order.address, {
        icon: numMarker,
    })
        .addTo(map)
        .on("click", clickZoom);
    marker.bindPopup(
        `<b>Order ID:</b> ${order.id}<br><b>Location:</b> ${order.location}<br><b>Driver:</b> ${order.driver}`
    );

    marker.on("mouseover", function (e) {
        this.openPopup();
    });

    marker.on("mouseout", function (e) {
        this.closePopup();
    });
    // set center map
    function clickZoom(e) {
        map.setView(e.target.getLatLng(), zoom);

        setActive(e.target._leaflet_id);
    }
    markers[order.id] = marker; // Store marker by order ID

    row.addEventListener("click", function () {
        // Highlight selected marker
        highlightMarker(order.id);
        // Pan map to the marker
        map.setView(order.address, zoom);
    });
    // Add the coordinates to the latlngs array
    latlngs.push(order.address);
});

function highlightMarker(orderId) {
    console.log(orderId, markers);

    // Reset all markers to default
    Object.values(markers).forEach((marker) => {
        marker.setIcon(
            L.divIcon({
                className: "custom-icon",
                html:
                    "<div class='content-icon'><i class='fa-solid fa-location-pin'></i><span class='icon-number'>" +
                    markers[orderId].options.icon.options.html.match(
                        /<span class='icon-number'>(\d+)<\/span>/
                    )[1] +
                    "</span></div>",
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30],
            })
        );
    });

    // Highlight the selected marker
    markers[orderId].setIcon(
        L.divIcon({
            className: "custom-icon",
            html:
                "<div class='content-icon' ><i class='fa-solid fa-location-pin'></i><span class='icon-number active-marker'>" +
                markers[orderId].options.icon.options.html.match(
                    /<span class='icon-number'>(\d+)<\/span>/
                )[1] +
                "</span></div>",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
        })
    );
}

// Draw polyline between markers
L.polyline(latlngs, { color: "blue" }).addTo(map);