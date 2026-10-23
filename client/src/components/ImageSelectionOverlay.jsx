import React, { useEffect, useState, useRef } from 'react';

export default function ImageSelectionOverlay({
  selectedImage,
  onUpdateDimensions,
  onDeselect
}) {
  const [rect, setRect] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [dragHandle, setDragHandle] = useState(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const updateRect = () => {
    if (!selectedImage?.el) {
      setRect(null);
      return;
    }
    const r = selectedImage.el.getBoundingClientRect();
    setRect({
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height
    });
  };

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [selectedImage]);

  if (!rect || !selectedImage?.el) return null;

  const handleMouseDown = (handle, e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setDragHandle(handle);
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPosRef.current.x;
      const deltaY = moveEvent.clientY - startPosRef.current.y;
      let newW = startPosRef.current.width;
      let newH = startPosRef.current.height;

      const aspectRatio = selectedImage.aspectRatio || (startPosRef.current.width / startPosRef.current.height);
      const isLocked = selectedImage.lockAspectRatio !== false;

      if (handle.includes('right')) newW = Math.max(30, startPosRef.current.width + deltaX);
      if (handle.includes('left')) newW = Math.max(30, startPosRef.current.width - deltaX);
      if (handle.includes('bottom')) newH = Math.max(30, startPosRef.current.height + deltaY);
      if (handle.includes('top')) newH = Math.max(30, startPosRef.current.height - deltaY);

      if (isLocked) {
        if (handle === 'right' || handle === 'left') {
          newH = newW / aspectRatio;
        } else if (handle === 'top' || handle === 'bottom') {
          newW = newH * aspectRatio;
        } else {
          // Corner handles
          newH = newW / aspectRatio;
        }
      }

      const newWidthCm = +(newW / 37.795).toFixed(2);
      const newHeightCm = +(newH / 37.795).toFixed(2);

      onUpdateDimensions(newWidthCm, newHeightCm, newW, newH);
      updateRect();
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setDragHandle(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStyle = "w-2.5 h-2.5 bg-white border-1.5 border-[#185abd] rounded-full shadow-2xs absolute z-50 hover:scale-125 transition-transform";

  const widthCmDisplay = (rect.width / 37.795).toFixed(2).replace('.', ',');
  const heightCmDisplay = (rect.height / 37.795).toFixed(2).replace('.', ',');

  return (
    <div
      className="absolute pointer-events-none z-40 select-none"
      style={{
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      }}
    >
      {/* 1. Bounding Outline (Solid Blue Ala Microsoft Word) */}
      <div className="absolute inset-0 border-[1.5px] border-[#185abd] shadow-2xs pointer-events-none" />

      {/* 2. Dimension Tooltip when dragging or hover */}
      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900/85 text-white px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none">
        {widthCmDisplay} cm × {heightCmDisplay} cm
      </div>

      {/* 3. Top Rotation Handle Pin */}
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const currentRot = selectedImage.rotateDeg || 0;
            selectedImage.el.style.transform = `rotate(${(currentRot + 90) % 360}deg)`;
          }}
          className="w-3 h-3 rounded-full border-1.5 border-[#185abd] bg-emerald-500 hover:scale-125 transition-transform cursor-grab shadow-2xs"
          title="Putar 90°"
        />
        <div className="w-px h-2 bg-[#185abd]" />
      </div>

      {/* 4. 8 Circular Resize Handles */}
      {/* Top Left */}
      <div
        onMouseDown={(e) => handleMouseDown('top-left', e)}
        className={`${handleStyle} -top-1.5 -left-1.5 cursor-nwse-resize pointer-events-auto`}
      />
      {/* Top Center */}
      <div
        onMouseDown={(e) => handleMouseDown('top', e)}
        className={`${handleStyle} -top-1.5 left-1/2 transform -translate-x-1/2 cursor-ns-resize pointer-events-auto`}
      />
      {/* Top Right */}
      <div
        onMouseDown={(e) => handleMouseDown('top-right', e)}
        className={`${handleStyle} -top-1.5 -right-1.5 cursor-nesw-resize pointer-events-auto`}
      />
      {/* Middle Left */}
      <div
        onMouseDown={(e) => handleMouseDown('left', e)}
        className={`${handleStyle} top-1/2 -left-1.5 transform -translate-y-1/2 cursor-ew-resize pointer-events-auto`}
      />
      {/* Middle Right */}
      <div
        onMouseDown={(e) => handleMouseDown('right', e)}
        className={`${handleStyle} top-1/2 -right-1.5 transform -translate-y-1/2 cursor-ew-resize pointer-events-auto`}
      />
      {/* Bottom Left */}
      <div
        onMouseDown={(e) => handleMouseDown('bottom-left', e)}
        className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-nesw-resize pointer-events-auto`}
      />
      {/* Bottom Center */}
      <div
        onMouseDown={(e) => handleMouseDown('bottom', e)}
        className={`${handleStyle} -bottom-1.5 left-1/2 transform -translate-x-1/2 cursor-ns-resize pointer-events-auto`}
      />
      {/* Bottom Right */}
      <div
        onMouseDown={(e) => handleMouseDown('bottom-right', e)}
        className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-nwse-resize pointer-events-auto`}
      />
    </div>
  );
}
