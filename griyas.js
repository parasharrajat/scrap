function fetch() {
    function parseString(str) {
        return unescape(str.trim());
    }
    function parsePincode(str) {
        const parts = str.split('Pincode:');
        return parts[1].trim();
    }
    function parsePhone(str) {
        const parts = str.split('Phone:');
        const phoneNumbers = parts[1].trim();
        const numbers = phoneNumbers.split('|').map(s => s.trim());
        return numbers;
    }
    function parseGps(str) {
        const parts = str.split('initialize(');
        const gpsValueIsHere = parts[1].trim();
        const partsAgain = gpsValueIsHere.split(',').map(s => s.trim());
        return { lat: partsAgain[0], lng: partsAgain[1] };
    }
    const stores = [];

    const table = document.querySelector("table#stores");
    const storesEls = table.querySelectorAll('tr > td.stores-view');

    Array.from(storesEls).forEach((store, index) => {
        const data = store.querySelectorAll('table#stores-inner tr:not(:last-child) > td');
        const gpsEl = store.querySelectorAll('table#stores-inner tr:last-child > td> table tr > td:last-child > button');
        const gpsStr = gpsEl[0].getAttribute('onClick');
        console.log(gpsStr); 
        const gps = parseGps(parseString(gpsStr));

        const storeData = {
            name: parseString(data[0].textContent),
            address: parseString(data[1].textContent),
            city: parseString(data[2].textContent),
            state: parseString(data[3].textContent),
            pincode: parsePincode(parseString(data[4].textContent)),
            phone: parsePhone(parseString(data[5].textContent)),
            lat: gps.lat,
            long: gps.lng,
        }
        stores.push(storeData);

    });
    console.log(stores, JSON.stringify(stores))
        ;
}
