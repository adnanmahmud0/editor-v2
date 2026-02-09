"use client";

import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export function LayersPanel() {
  const [layers, setLayers] = useState([
    {
      id: 1,
      name: "Layer 1",
      visible: true,
      locked: false,
      expanded: true,
      children: [
        { id: 2, name: "Rectangle", visible: true, locked: false },
        { id: 3, name: "Circle", visible: true, locked: false },
      ],
    },
    {
      id: 4,
      name: "Layer 2",
      visible: true,
      locked: false,
      expanded: false,
      children: [],
    },
    {
      id: 5,
      name: "Background",
      visible: true,
      locked: true,
      expanded: false,
      children: [],
    },
  ]);

  const toggleVisibility = (id: number) => {
    setLayers(
      layers.map((layer) => {
        if (layer.id === id) {
          return { ...layer, visible: !layer.visible };
        }
        if (layer.children) {
          return {
            ...layer,
            children: layer.children.map((child) =>
              child.id === id ? { ...child, visible: !child.visible } : child,
            ),
          };
        }
        return layer;
      }),
    );
  };

  const toggleLock = (id: number) => {
    setLayers(
      layers.map((layer) => {
        if (layer.id === id) {
          return { ...layer, locked: !layer.locked };
        }
        if (layer.children) {
          return {
            ...layer,
            children: layer.children.map((child) =>
              child.id === id ? { ...child, locked: !child.locked } : child,
            ),
          };
        }
        return layer;
      }),
    );
  };

  const toggleExpand = (id: number) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, expanded: !layer.expanded } : layer,
      ),
    );
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      <h3 className="text-xs font-semibold mb-4 text-gray-400 uppercase">
        Layers
      </h3>

      <div className="space-y-1">
        {layers.map((layer) => (
          <div key={layer.id}>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#333333] rounded cursor-pointer group">
              {layer.children && layer.children.length > 0 && (
                <button
                  onClick={() => toggleExpand(layer.id)}
                  className="text-gray-500"
                >
                  {layer.expanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}
              {(!layer.children || layer.children.length === 0) && (
                <div className="w-3" />
              )}
              <div className="flex-1 text-sm">{layer.name}</div>
              <button
                onClick={() => toggleVisibility(layer.id)}
                className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => toggleLock(layer.id)}
                className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {layer.locked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </button>
            </div>

            {layer.expanded &&
              layer.children &&
              layer.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 px-2 py-1.5 pl-8 hover:bg-[#333333] rounded cursor-pointer group"
                >
                  <div className="flex-1 text-sm text-gray-400">
                    {child.name}
                  </div>
                  <button
                    onClick={() => toggleVisibility(child.id)}
                    className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {child.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleLock(child.id)}
                    className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {child.locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
