#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv-mlx-asr"
DIST_DIR="${ROOT_DIR}/dist"
ARCHIVE_NAME="mlx_asr_worker-darwin-arm64.tar.gz"

if [ -z "${PYTHON_BIN:-}" ]; then
  if command -v python3.12 >/dev/null 2>&1; then
    PYTHON_BIN="python3.12"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "Python (3.12 recommended) is required to build the MLX ASR worker." >&2
    exit 1
  fi
fi

PYINSTALLER_VERSION="${PYINSTALLER_VERSION:-6.20.0}"
MLX_AUDIO_VERSION="${MLX_AUDIO_VERSION:-0.4.3}"
HUGGINGFACE_HUB_VERSION="${HUGGINGFACE_HUB_VERSION:-1.17.0}"
TRANSFORMERS_SPEC="${TRANSFORMERS_SPEC:->=5.7,<5.13}"

"${PYTHON_BIN}" -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/python" -m pip install -U pip
"${VENV_DIR}/bin/python" -m pip install -U \
  "pyinstaller==${PYINSTALLER_VERSION}" \
  "mlx-audio==${MLX_AUDIO_VERSION}" \
  "transformers${TRANSFORMERS_SPEC}" \
  "huggingface_hub[hf_xet]==${HUGGINGFACE_HUB_VERSION}"

rm -rf "${ROOT_DIR}/build/mlx_asr_worker" "${DIST_DIR}/mlx_asr_worker"
"${VENV_DIR}/bin/pyinstaller" \
  --clean \
  --onedir \
  --name mlx_asr_worker \
  --collect-all mlx \
  --collect-all mlx_audio \
  --collect-all huggingface_hub \
  --distpath "${DIST_DIR}" \
  --workpath "${ROOT_DIR}/build/mlx_asr_worker" \
  "${ROOT_DIR}/scripts/mlx_asr_server.py"

# PyInstaller emits many nested .dylib/.so files. Without a consistent signature,
# macOS blocks loading libpython (Team ID mismatch), which breaks Qwen in packaged
# builds when electron-builder skips signing (CSC_IDENTITY_AUTO_DISCOVERY=false).
if command -v codesign >/dev/null 2>&1; then
  SIGN_ID="${MLX_ASR_CODESIGN_IDENTITY:--}"
  echo "Signing MLX ASR worker bundle (identity: ${SIGN_ID})"
  codesign --deep --force --sign "${SIGN_ID}" "${DIST_DIR}/mlx_asr_worker"
fi

rm -f "${DIST_DIR}/${ARCHIVE_NAME}"
tar -C "${DIST_DIR}" -czf "${DIST_DIR}/${ARCHIVE_NAME}" mlx_asr_worker

echo "MLX ASR worker archive written to ${DIST_DIR}/${ARCHIVE_NAME}"
