// PDF documents are delivered through the authenticated notes endpoint, not static URLs.
export function publicPdfRequest(value) {
  let pathname;
  try{pathname=decodeURIComponent(String(value));}catch{return true;}
  return /^\/(?:upload|assets\/upload)\//i.test(pathname)&&/\.pdf(?:\/?$)/i.test(pathname);
}
export function protectPrivateDocuments(req,res,next){
  if(publicPdfRequest(req.path))return res.status(403).json({status:false,message:'Open or download notes through your signed-in classroom.'});
  return next();
}
