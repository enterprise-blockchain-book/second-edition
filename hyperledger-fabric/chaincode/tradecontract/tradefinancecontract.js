'use strict';
const shim = require('fabric-shim');

let TradeContract = class {

	async Init(stub) {
    console.log('=========== Instantiating tradecontract chaincode ===========');
		let ret = stub.getFunctionAndParameters();
		let args = ret.params;

		let tradeContract = {
			tradeId : args[0],
			buyerTaxId : args[1],
			sellerTaxId : args[2],
			skuid : args[3],
			exportBankId: "",
			importBankId: "",
			deliveryDate: null,
			shipperId: "",
			tradePrice : args[4],
			shippingPrice : args[5],
			status: "Trade initiated"
		};

		await stub.putState(args[0], Buffer.from(JSON.stringify(tradeContract)));
		console.log('=========== Instantiated tradecontract chaincode ===========');
		return shim.success();
  }

	async Invoke(stub) {
    console.info('=========== Invoking tradecontract chaincode ===========');
    let ret = stub.getFunctionAndParameters();

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

	async createLOC(stub, args) {
		let tradeId = args[0];
		let tcBytes = await stub.getState(tradeId);
    let tc = JSON.parse(tcBytes);


		if (tc.status == "Trade initiated") {
			tc.importBankId = "BNK_I_1";
			tc.status = "LOC created";
		} else {
			console.log("Trade not initiated yet");
		}

		await stub.putState(tradeId, Buffer.from(JSON.stringify(tc)));

	}

	async approveLOC(stub, args) {
		let tradeId = args[0];
		let tcBytes = await stub.getState(tradeId);
    let tc = JSON.parse(tcBytes);

		if (tc.status == "LOC created") {
			tc.exportBankId = "BNK_E_1";
			tc.status = "LOC approved";
		} else {
			tc.status = "Error";
			console.log("LOC not found");
		}

		await stub.putState(tradeId, Buffer.from(JSON.stringify(tc)));
	}

	async initiateShipment(stub, args) {
		let tradeId = args[0];
		let tcBytes = await stub.getState(tradeId);
    let tc = JSON.parse(tcBytes);

		if (tc.status == "LOC approved") {
			//tc.DeliveryDate = "2017-10-31"
			//set date to one month from as per contract
			var current = new Date();
			current.setMonth(current.getMonth() + 1);
			tc.deliveryDate = current;

			tc.status = "Shipment initiated";
		} else {
			console.log("LOC not found");
		}

		await stub.putState(tradeId, Buffer.from(JSON.stringify(tc)));
	}

	async deliverGoods(stub, args) {
		let tradeId = args[0];
		let tcBytes = await stub.getState(tradeId);
    let tc = JSON.parse(tcBytes);

		if (tc.status == "Shipment initiated") {
			tc.shipperId = "SHP_1";
			tc.status = "BOL created";
		} else {
			console.log("Shipment not initiated yet");
		}

		await stub.putState(tradeId, Buffer.from(JSON.stringify(tc)));
	}

	async shipmentDelivered(stub, args) {
		let tradeId = args[0];
		let tcBytes = await stub.getState(tradeId);
    let tc = JSON.parse(tcBytes);

		if (tc.status == "BOL created") {
			tc.status = "Trade completed";
			console.log("Trade complete");
		} else {
			console.log("BAL not created yet");
		}

		await stub.putState(tradeId, Buffer.from(JSON.stringify(tc)));
	}

	async query(stub, args) {
		var A; // Entities
		var err;

		if (args.length != 1) {
			throw new Error("Incorrect number of arguments. Expecting name of the entity to query");
		}

		A = args[0];
		let avalbytes = await stub.getState(A);
		if (!avalbytes || avalbytes.toString().length <= 0) {
      throw new Error(A + ' does not exist: ');
    }

    console.log(avalbytes.toString());

    return avalbytes;

	}

};

shim.start(new TradeContract());
