const { express } = require("../commonImports/commonImports");
const {
  ConfirmPayment,
} = require("../controllers/transactionsControllers/routeHandlers");

const router = express.Router();

router.post("/confirmpayment", ConfirmPayment);

module.exports = router;
