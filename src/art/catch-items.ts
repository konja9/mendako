// ミニゲーム「マリンスノーキャッチ」で降ってくるもの（canvas に描く）。
// 48×48 の中央 (24, 24) を中心に描く。揺れや点滅は描画側で付ける。

export type CatchKind = 'snow' | 'copepod' | 'pearl' | 'trash';

export const CATCH_ITEM_SIZE = 48;

export function drawCatchItem(ctx: CanvasRenderingContext2D, kind: CatchKind) {
  ctx.save();
  ctx.translate(24, 24);
  switch (kind) {
    case 'snow': {
      ctx.fillStyle = 'rgba(235, 245, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4f9ff';
      for (const [dx, dy, r] of [
        [0, 0, 4.5],
        [4, -3, 3],
        [-4, 2, 3],
        [2, 4, 2.5],
      ]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'copepod': {
      // カイアシ類にはノープリウス眼という赤い目がひとつある
      ctx.strokeStyle = '#ffd9b8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.quadraticCurveTo(-12, -12, -16, -6);
      ctx.moveTo(3, -7);
      ctx.quadraticCurveTo(12, -12, 16, -6);
      ctx.moveTo(0, 9);
      ctx.lineTo(-3, 15);
      ctx.moveTo(0, 9);
      ctx.lineTo(3, 15);
      ctx.stroke();
      ctx.fillStyle = '#ffab66';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0484f';
      ctx.beginPath();
      ctx.arc(0, -4.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pearl': {
      ctx.fillStyle = 'rgba(255, 244, 200, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbf7ff';
      ctx.strokeStyle = '#b9a5f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-2.5, -2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'trash': {
      // 深海にも届いてしまうビニール袋
      ctx.fillStyle = 'rgba(214, 226, 240, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.quadraticCurveTo(-14, 14, -8, 15);
      ctx.lineTo(8, 15);
      ctx.quadraticCurveTo(14, 14, 12, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.quadraticCurveTo(-9, -16, -4, -6);
      ctx.moveTo(10, -6);
      ctx.quadraticCurveTo(9, -16, 4, -6);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}
