let isSelecting = false;

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "start_selection") {
    isSelecting = true;
    document.body.style.cursor = "crosshair";
    alert("Hãy click vào thành phần bạn muốn đưa vào PiP!");
  }
});

document.addEventListener("click", async (e) => {
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();
  isSelecting = false;
  document.body.style.cursor = "default";

  const targetElement = e.target;
  await openInDocumentPiP(targetElement);
}, true);

async function openInDocumentPiP(element) {
  if (!('documentPictureInPicture' in window)) {
    alert("Trình duyệt của bạn không hỗ trợ Document PiP API.");
    return;
  }

  // 1. Mở cửa sổ PiP
  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: element.clientWidth,
    height: element.clientHeight,
  });

  // 2. Sao chép styles từ trang gốc sang cửa sổ PiP để element giữ nguyên giao diện
  [...document.styleSheets].forEach((styleSheet) => {
    try {
      const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
      const style = document.createElement('style');
      style.textContent = cssRules;
      pipWindow.document.head.appendChild(style);
    } catch (e) {
      // Một số stylesheet từ domain khác có thể bị chặn bởi CORS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = styleSheet.href;
      pipWindow.document.head.appendChild(link);
    }
  });

  // 3. Di chuyển element vào cửa sổ PiP
  const placeholder = document.createElement("div");
  element.replaceWith(placeholder); // Để lại chỗ trống ở trang gốc
  pipWindow.document.body.append(element);

  // 4. Khi đóng cửa sổ PiP, đưa element quay lại trang gốc
  pipWindow.addEventListener("pagehide", () => {
    placeholder.replaceWith(element);
  });
}
