백엔드 서버 켜기
C:\Users\qwr01\cooling-fog\backend> venv\Scripts\Activate.ps1

(venv) PS C:\Users\qwr01\cooling-fog\backend> uvicorn app.main:app --reload --port 8050

프론트엔드 서버 켜기
C:\Users\qwr01\cooling-fog>npm start



PS C:\Users\qwr01\.ssh> ssh -i C:\Users\qwr01\.ssh\coolingfog-key.pem ubuntu@3.36.112.6

(venv) ubuntu@ip-172-31-3-11:~/cooling-fog-dashboard/cooling-fog/backend$ uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload