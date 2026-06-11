import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model = null;
let isLoading = false;

const ORGANIC_KEYWORDS = [
  'apple', 'banana', 'orange', 'lemon', 'lime', 'pear', 'peach', 'plum', 'mango',
  'grape', 'strawberry', 'blueberry', 'raspberry', 'melon', 'watermelon', 'pineapple',
  'kiwi', 'avocado', 'tomato', 'potato', 'onion', 'carrot', 'celery', 'broccoli',
  'spinach', 'lettuce', 'cabbage', 'pepper', 'cucumber', 'zucchini', 'eggplant',
  'mushroom', 'garlic', 'ginger', 'corn', 'pea', 'bean', 'rice', 'pasta', 'bread',
  'cake', 'cookie', 'pie', 'pizza', 'burger', 'sandwich', 'hot dog', 'taco', 'burrito',
  'egg', 'meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'salmon', 'shrimp',
  'lobster', 'crab', 'bacon', 'sausage', 'ham', 'steak', 'veal', 'lamb', 'duck',
  'goose', 'rabbit', 'venison', 'horse', 'cheese', 'milk', 'butter', 'cream', 'yogurt',
  'ice cream', 'chocolate', 'candy', 'sugar', 'honey', 'syrup', 'jam', 'jelly',
  'peanut butter', 'nut', 'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut',
  'seed', 'sunflower', 'pumpkin', 'squash', 'gourd', 'fruit', 'vegetable', 'food',
  'meal', 'dish', 'soup', 'stew', 'salad', 'snack', 'drink', 'juice', 'coffee',
  'tea', 'beer', 'wine', 'soda', 'water', 'bottle', 'cup', 'plate', 'bowl',
  'fork', 'knife', 'spoon', 'napkin', 'paper towel', 'tissue', 'toilet paper',
  'flower', 'plant', 'leaf', 'grass', 'hay', 'straw', 'wood', 'bark', 'twig',
  'shell', 'bone', 'skin', 'fur', 'feather', 'hair', 'nail', 'claw', 'hoof',
  'apple juice', 'orange juice', 'tomato sauce', 'ketchup', 'mustard', 'mayo',
  'salsa', 'guacamole', 'hummus', 'tahini', 'oil', 'vinegar', 'soy sauce',
  'fish sauce', 'curry', 'spice', 'herb', 'basil', 'cilantro', 'parsley', 'mint',
  'thyme', 'rosemary', 'oregano', 'sage', 'dill', 'chive', 'lemongrass',
  'lunch', 'breakfast', 'dinner', 'appetizer', 'dessert', 'entree', 'side dish',
  'leftover', 'expired', 'rotten', 'spoiled', 'waste', 'garbage', 'trash',
  'compost', 'organic matter', 'biomass', 'food waste', 'kitchen waste'
];

const NON_ORGANIC_KEYWORDS = [
  'plastic', 'bottle', 'can', 'tin', 'aluminum', 'metal', 'glass', 'paper',
  'cardboard', 'box', 'wrapper', 'packaging', 'bag', 'cup', 'straw', 'utensil',
  'fork', 'knife', 'spoon', 'plate', 'bowl', 'container', 'foil', 'film',
  'bubble wrap', 'styrofoam', 'polystyrene', 'rubber', 'tire', 'battery',
  'electronic', 'phone', 'computer', 'tv', 'monitor', 'lamp', 'wire', 'cable',
  'charger', 'bulb', 'light', 'bicycle', 'car', 'vehicle', 'toy', 'game',
  'book', 'magazine', 'newspaper', 'mail', 'document', 'paper', 'envelope',
  'label', 'sticker', 'tag', 'band', 'rope', 'string', 'twine', 'net',
  'fabric', 'cloth', 'clothing', 'shirt', 'pants', 'dress', 'shoe', 'boot',
  'hat', 'glove', 'scarf', 'jacket', 'coat', 'suit', 'tie', 'belt',
  'ceramic', 'porcelain', 'tile', 'brick', 'concrete', 'stone', 'marble',
  'mirror', 'window', 'glass', 'bottle', 'jar', 'vase', 'dish', 'cup',
  'chair', 'table', 'desk', 'shelf', 'cabinet', 'bed', 'mattress', 'pillow',
  'blanket', 'towel', 'rug', 'carpet', 'curtain', 'blind', 'picture', 'frame',
  'clock', 'watch', 'jewelry', 'ring', 'necklace', 'bracelet', 'earring',
  'medicine', 'pill', 'drug', 'vitamin', 'syringe', 'bandage', 'gauze',
  'cosmetic', 'makeup', 'perfume', 'shampoo', 'soap', 'toothpaste', 'deodorant',
  'cigarette', 'tobacco', 'lighter', 'match', 'firework', 'paint', 'solvent',
  'chemical', 'cleaner', 'detergent', 'bleach', 'ammonia', 'acid', 'oil',
  'motor oil', 'gear', 'lubricant', 'adhesive', 'glue', 'tape', 'putty',
  'cement', 'mortar', 'plaster', 'insulation', 'drywall', 'shingle', 'tar',
  'asphalt', 'gravel', 'sand', 'soil', 'dirt', 'dust', 'ash', 'cinder',
  'ceramic', 'glass', 'crystal', 'china', 'earthenware', 'terracotta',
  'brick', 'tile', 'concrete', 'rock', 'stone', 'pebble', 'boulder'
];

export async function loadModel() {
  if (model) return model;
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model;
  }
  
  isLoading = true;
  try {
    await tf.ready();
    model = await mobilenet.load({
      version: 2,
      alpha: 1.0
    });
    return model;
  } catch (error) {
    console.error('Failed to load model:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

function classifyFromPredictions(predictions) {
  if (!predictions || predictions.length === 0) {
    return { isOrganic: true, confidence: 0.5, label: 'Unknown', matchedKeyword: null };
  }

  const topPrediction = predictions[0].className.toLowerCase();
  const topConfidence = predictions[0].probability;

  let organicScore = 0;
  let nonOrganicScore = 0;
  let matchedKeyword = null;

  for (const keyword of ORGANIC_KEYWORDS) {
    if (topPrediction.includes(keyword)) {
      organicScore += 1;
      if (!matchedKeyword) matchedKeyword = keyword;
    }
  }

  for (const keyword of NON_ORGANIC_KEYWORDS) {
    if (topPrediction.includes(keyword)) {
      nonOrganicScore += 1;
      if (!matchedKeyword) matchedKeyword = keyword;
    }
  }

  let isOrganic;
  let confidence;

  if (organicScore > nonOrganicScore) {
    isOrganic = true;
    confidence = Math.min(0.5 + (organicScore * 0.1) + (topConfidence * 0.3), 0.98);
  } else if (nonOrganicScore > organicScore) {
    isOrganic = false;
    confidence = Math.min(0.5 + (nonOrganicScore * 0.1) + (topConfidence * 0.3), 0.98);
  } else {
    isOrganic = true;
    confidence = 0.6;
  }

  return {
    isOrganic,
    confidence,
    label: topPrediction.split(',')[0].trim(),
    matchedKeyword,
    allPredictions: predictions.slice(0, 5).map(p => ({
      label: p.className.split(',')[0].trim(),
      probability: p.probability
    }))
  };
}

export async function classifyWaste(imageElement) {
  const mobilenetModel = await loadModel();
  
  const predictions = await mobilenetModel.classify(imageElement);
  
  return classifyFromPredictions(predictions);
}

export async function classifyWasteFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const result = await classifyWaste(img);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}
