"use strict";

// Given anything, create a string from it.
// Helps with sending messages over IPC, displaying alerts, etc.

module.exports = (msg) => {
	if (typeof msg === "string") {
		return msg.trim();
	}
	let str;
	try {
		if (msg instanceof Error) {
			str = String(msg);									// Error objects (same-realm only)
		} else if (msg !== null && typeof msg === "object") {
			try {
				str = JSON.stringify(msg) ?? String(msg);		// Other (normal) objects. The ?? handles foo.toJSON() -> undefined
			} catch {
				str = String(msg);								// JSON.stringify threw: circular, toJSON() -> throw, BigInt value inside, too deep
			}
		} else {
			str = String(msg);									// null, undefined, number, boolean, symbol, bigint, function
		}
	} catch {
		try {
			str = Object.prototype.toString.call(msg);			// String() threw (e.g. circular null-proto object), or instanceof trapped (proxy)
		} catch {
			str = "[unstringifiable " + typeof msg + "]";		// hostile / revoked proxies
		}
	}
	return str.trim();
};

// Tests... uncomment to run.......................................................................
/*

let run_tests = () => {
	let passed = 0;
	let failed = 0;

	let check = (label, input, expected) => {
		let actual;
		try {
			actual = module.exports(input);
		} catch (err) {
			failed++;
			console.log(`FAIL  ${label}: threw ${err}`);
			return;
		}
		if (actual === expected) {
			passed++;
			console.log(`ok    ${label}: ${JSON.stringify(actual)}`);
		} else {
			failed++;
			console.log(`FAIL  ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
		}
	};

	// --- Strings (early return + trim) ---

	check("plain string", "hello", "hello");
	check("string needing trim", "  padded \n", "padded");
	check("empty string", "", "");

	// --- Primitives (else branch) ---

	check("null", null, "null");
	check("undefined", undefined, "undefined");
	check("number", 42, "42");
	check("negative float", -3.14, "-3.14");
	check("NaN", NaN, "NaN");
	check("Infinity", Infinity, "Infinity");
	check("boolean true", true, "true");
	check("boolean false", false, "false");
	check("bigint", 123n, "123");
	check("symbol", Symbol("tag"), "Symbol(tag)");

	// --- Functions ---

	let named_fn = function my_func() {};
	check("function", named_fn, String(named_fn).trim());

	// --- Errors ---

	check("error with message", new Error("boom"), "Error: boom");
	check("error no message", new Error(), "Error");
	check("type error", new TypeError("bad"), "TypeError: bad");

	// --- Normal objects (JSON branch) ---

	check("plain object", { a: 1, b: "two" }, "{\"a\":1,\"b\":\"two\"}");
	check("array", [1, 2, 3], "[1,2,3]");
	check("empty object", {}, "{}");
	check("null-proto object", Object.assign(Object.create(null), { x: 1 }), "{\"x\":1}");
	check("date", new Date("2026-01-01T00:00:00.000Z"), "\"2026-01-01T00:00:00.000Z\"");

	// --- toJSON edge cases ---

	check("toJSON -> undefined (?? fallback to String)", { toJSON: () => undefined }, "[object Object]");
	check("toJSON -> throw (inner catch to String)", { toJSON: () => { throw new Error("no"); } }, "[object Object]");

	// --- JSON.stringify failures (inner catch) ---

	let circular = {};
	circular.self = circular;
	check("circular object", circular, "[object Object]");

	check("object containing bigint", { n: 1n }, "[object Object]");

	// --- Double failure: JSON throws AND String throws (outer catch) ---

	let circular_null_proto = Object.create(null);
	circular_null_proto.self = circular_null_proto;
	check("circular null-proto object", circular_null_proto, "[object Object]");

	let hostile_to_string = {
		toJSON: () => { throw new Error("no json"); },
		toString: () => { throw new Error("no string"); },
	};
	check("throwing toJSON and toString", hostile_to_string, "[object Object]");

	// --- Error whose toString throws (outer catch) ---

	let bad_error = new Error("x");
	bad_error.toString = () => { throw new Error("nope"); };
	check("error with throwing toString", bad_error, "[object Error]");

	// --- Proxies (last-resort fallback) ---

	let revocable = Proxy.revocable({}, {});
	revocable.revoke();
	check("revoked proxy", revocable.proxy, "[unstringifiable object]");

	let hostile_proxy = new Proxy({}, {
		get: () => { throw new Error("trap"); },
		getPrototypeOf: () => { throw new Error("trap"); },
	});
	check("hostile proxy", hostile_proxy, "[unstringifiable object]");

	// --- Cross-realm-ish / duck-typed error (documents the "{}" behavior) ---

	let fake_error = Object.create(Object.prototype);
	Object.defineProperty(fake_error, "message", { value: "hidden", enumerable: false });
	check("error-like object, non-enumerable props", fake_error, "{}");

	// --- Summary ---

	console.log(`\n${passed} passed, ${failed} failed`);
	if (failed > 0) {
		process.exitCode = 1;
	}
};

run_tests();

*/
