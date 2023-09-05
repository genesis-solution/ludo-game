const { express, verifyToken } = require("../commonImports/commonImports");
const {
  handleBuyChips,
  handleSellChips,
  handleGetWallet,

} = require("../controllers/transactionsControllers/routeHandlers");

const router = express.Router();

router.post("/buy", verifyToken, handleBuyChips);
router.post("/sell", verifyToken, handleSellChips);
router.get("/wallet", verifyToken, handleGetWallet);


module.exports = router;
