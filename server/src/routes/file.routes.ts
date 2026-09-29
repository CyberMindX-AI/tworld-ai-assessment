import {Router} from 'express'; import {files} from '../controllers/file.controller'; const r=Router();r.get('/',files);export default r;
