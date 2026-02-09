export const categoriesData = [
    {
        id: "cat-001",
        name: "A5 Booklets / Order of Ceremony",
        description: "Printed A5 booklets for funerals and ceremony services.",
        longDescription: "Funeral Booklets can act as a beautiful keepsake for family and friends as the booklet collates the photos and memories of someone’s life. As the Order of Ceremony it allows guests to stay informed regarding the most important details and proceedure of the funeral or memorial service. Often details of the wake are included on the back page.",
        features: [
            "Your booklet must contain a minimum of four pages, with the total page count in multiples of four to prevent any blank pages. Each booklet is bound with 2 staples."
        ],
        specifications: {
            title: "A5 Finished Size",
            details: "148mm wide x 210mm high (A4 folded in half) Printed on 150gsm paper"
        },
        image: "https://placehold.co/600x400/png?text=A5+Booklets",
        imageAlt: "A5 funeral memorial booklets displayed together",
        url: "/products/a5-booklets",
        fields: [
            {
                id: "f-001",
                name: "Number of Pages",
                key: "pages",
                type: "select",
                values: ["4", "8", "12", "16", "20", "24", "28", "32"],
                required: true,
            },
            {
                id: "f-002",
                name: "Quantity",
                key: "quantity",
                type: "select",
                values: ["50", "100", "200", "500", "1000"],
                required: true,
            },
        ],
        pricing: {
            type: "table",
            prices: {
                "4": { "50": 132, "100": 161, "200": 217, "500": 387, "1000": 612 },
                "8": { "50": 160, "100": 215, "200": 324, "500": 594, "1000": 1092 },
                "12": { "50": 224, "100": 305, "200": 458, "500": 867, "1000": 1602 },
                "16": { "50": 252, "100": 322, "200": 536, "500": 1074, "1000": 2048 },
                "20": { "50": 280, "100": 413, "200": 667, "500": 1347, "1000": 2560 },
                "24": { "50": 308, "100": 433, "200": 755, "500": 1567, "1000": 3032 },
                "28": { "50": 337, "100": 524, "200": 882, "500": 1840, "1000": 3543 },
                "32": { "50": 349, "100": 541, "200": 967, "500": 2047, "1000": 3989 },
            },
        },
    },

    {
        id: "cat-002",
        name: "Folded A5 Cards",
        description: "A4 sheets folded into A5 memorial cards.",
        longDescription: "A folded A5 card is a classic choice for funeral stationery. It provides ample space for a photo, a hymn or poem, and details of the service. Printed on high-quality card stock, these cards are a durable and elegant keepsake.",
        features: [
            "Standard A5 size when folded (A4 flat).",
            "Printed on premium 300gsm card stock."
        ],
        specifications: {
            title: "A5 Folded Size",
            details: "148mm wide x 210mm high (folded). 297mm x 210mm (flat)."
        },
        image: "/home/Folded-Cards.jpg",
        imageAlt: "A4 folded funeral memorial card",
        url: "/products/folded-cards",
        fields: [
            {
                id: "f-201",
                name: "Quantity",
                key: "quantity",
                type: "select",
                values: ["50", "100", "200", "500", "1000"],
                required: true,
            },
        ],
        pricing: {
            type: "table",
            prices: {
                "50": 155,
                "100": 176,
                "200": 218,
                "500": 342,
                "1000": 548,
            },
        },
    },

    {
        id: "cat-003",
        name: "Flat A5 Cards",
        description: "Printed flat memorial cards in A5 or A6 format.",
        longDescription: "Flat memorial cards are a simple yet elegant way to honour your loved one. Available in A5 or A6 sizes, these cards are perfect for including a photo and a brief message or order of service. They can be double-sided to maximize space.",
        features: [
            "Available in A5 (148x210mm) or A6 (105x148mm).",
            "Printed on thick 350gsm card for a premium feel."
        ],
        specifications: {
            title: "Size Options",
            details: "A5 (148x210mm) or A6 (105x148mm)."
        },
        image: "/home/Flat-Cards.png",
        imageAlt: "Flat memorial cards",
        url: "/products/flat-cards",
        fields: [
            {
                id: "f-101",
                name: "Quantity",
                key: "quantity",
                type: "select",
                values: ["50", "100", "200", "500", "1000"],
                required: true,
            },
        ],
        pricing: {
            type: "table",
            prices: {
                "50": 95,
                "100": 116,
                "200": 160,
                "500": 287,
                "1000": 501,
            },
        },
    },

    {
        id: "cat-004",
        name: "Bookmarks",
        description: "High-quality printed memorial bookmarks.",
        longDescription: "Memorial bookmarks are a practical and lasting tribute. They are perfect for distributing at the funeral or sending to those who couldn't attend. Laminated for durability, they can be used daily as a reminder of your loved one.",
        features: [
            "Standard bookmark size (55x200mm).",
            "Laminated gloss or matte finish for longevity."
        ],
        specifications: {
            title: "Standard Size",
            details: "55mm wide x 200mm high. Laminated."
        },
        image: "https://placehold.co/600x400/png?text=Bookmarks",
        imageAlt: "Printed memorial bookmarks",
        url: "/products/bookmarks",
        fields: [
            {
                id: "f-301",
                name: "Quantity",
                key: "quantity",
                type: "select",
                values: ["50", "100", "200", "500", "1000"],
                required: true,
            },
        ],
        pricing: {
            type: "table",
            prices: {
                "50": 77,
                "100": 81,
                "200": 90,
                "500": 115,
                "1000": 155,
            },
        },
    },
] as const;

export type Category = typeof categoriesData[number];
