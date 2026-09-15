const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: 'dabhisanjay901@gmail.com'
    },
    whatsappNumber: {
      type: String,
      default: '9023374410'
    },
    themeColor: {
      type: String,
      default: '#581C87' // Deep Purple
    },
    enableCreditCard: {
      type: Boolean,
      default: true
    },
    enableRazorpay: {
      type: Boolean,
      default: true
    },
    enablePaypal: {
      type: Boolean,
      default: true
    },
    enableCOD: {
      type: Boolean,
      default: true
    },
    shopName: {
      type: String,
      default: 'CosmeGlow Skincare'
    }, 
    address: {
      type: String,
      default: '10, GURUKRUPA SOCIETY, NEAR ARCHANA SOCIETY, DABHOLI ROAD, KATARGAM SURAT GUJARAT 395004 India'
    },
    gstNumber: {
      type: String,
      default: '24AAAAA0000A1Z5'
    },
    logo: {
      type: String,
      default: '/logo.png'
    },
    enableTax: {
      type: Boolean,
      default: false
    },
    taxPercentage: {
      type: Number,
      default: 8
    },
    taxName: {
      type: String,
      default: 'GST'
    },
    enableDeliveryCharge: {
      type: Boolean,
      default: false
    },
    deliveryCharge: {
      type: Number,
      default: 40
    },
    enableFreeDeliveryThreshold: {
      type: Boolean,
      default: false
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500
    },
    banners: {
      type: [String],
      default: [
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop'
      ]
    },
    homepageImages: {
      spotlight: {
        type: String,
        default: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop'
      },
      spotlightName: {
        type: String,
        default: 'Restorative Peptide Serum'
      },
      spotlightDescription: {
        type: String,
        default: 'A concentrated multi-peptide serum designed to target visible signs of aging, restore firmness, and deeply hydrate the skin.'
      },
      spotlightPrice: {
        type: Number,
        default: 85
      },
      spotlightOldPrice: {
        type: Number,
        default: 110
      },
      about: {
        main: {
          type: String,
          default: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop'
        },
        secondary: {
          type: String,
          default: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop'
        }
      }
    },
    privacyPolicy: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: [String], default: [] }
        }
      ],
      default: [
        {
          title: 'Introduction',
          content: [
            'We value your privacy and are committed to protecting your personal data.',
            'This policy details how we collect, process, and protect your information.'
          ]
        }
      ]
    },
    termsConditions: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: [String], default: [] }
        }
      ],
      default: [
        {
          title: 'General Terms',
          content: [
            'By accessing or purchasing from CosmeGlow, you agree to comply with our Terms & Conditions.',
            'We reserve the right to update these terms at any time.'
          ]
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
module.exports = Settings;
