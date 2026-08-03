// cPanel/Passenger-compatible startup file. Environment mode comes from
// NODE_ENV supplied by hosting. Passenger is a production runtime, so use
// production when the hosting panel does not explicitly provide a mode.
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
}

await import("./server.js");
