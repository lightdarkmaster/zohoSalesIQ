function loadZohoSalesIQ() {
    // Prevent loading the widget multiple times
    if (document.getElementById("zsiqscript")) {
        return;
    }

    window.$zoho = window.$zoho || {};
    $zoho.salesiq = $zoho.salesiq || {
        ready: function () {
            console.log("Zoho SalesIQ is ready.");
        }
    };

    const script = document.createElement("script");
    script.id = "zsiqscript";
    script.src = "https://salesiq.zohopublic.com/widget?wc=siq7fa62a005690bdbf684da7f7ecc8a4bf34dd38e2c2bdd8cca6d71c4c7cd73afe";
    script.defer = true;

    document.head.appendChild(script);
}

// Load the widget
loadZohoSalesIQ();