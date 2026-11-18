export function apiErrorHandler(error,req,res,next) {
  if (!req.path.startsWith('/api/') || res.headersSent) return next(error);
  console.error('[API ERROR]',req.method,req.path,error.code||error.name||'Error');
  const status=Number.isInteger(error.status)&&error.status>=400&&error.status<600?error.status:500;
  return res.status(status).json({status:false,code:'REQUEST_FAILED',message:status>=500?'The server could not complete this request. Please try again shortly.':'The request could not be processed. Please check your details and try again.'});
}
