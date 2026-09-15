const express = require('express');
const router = express.Router();
const { getAllMaterials, getMaterialById } = require('../services/materialService');

router.get('/', async (req, res) => {
  try {
    const materials = await getAllMaterials();
    return res.json({
      success: true,
      data: materials
    });
  } catch (err) {
    console.error('[Material Route Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const material = await getMaterialById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found in database.'
      });
    }
    return res.json({
      success: true,
      data: material
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
