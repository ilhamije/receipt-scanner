from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.ai.openai_handler import analyze_receipt

router = APIRouter()


@router.post("", include_in_schema=False)
@router.post("/")
async def upload_receipt(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        contents = await file.read()
        result = await analyze_receipt(
            file_bytes=contents,
            filename=file.filename or "receipt",
            content_type=file.content_type,
        )
        return JSONResponse(content=result, status_code=200)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()
