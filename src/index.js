/*jslint node: true */
"use strict";

import {template, semAnn, ontoTerm} from './Context';
import {clone as _clone, groupBy as _groupBy, 
    forEach as _forEach, 
    uniqWith as _uniqWith, 
    isEqual as _isEqual} from 'lodash-es';

class BioteaBioschemasAnnotations extends HTMLElement  {    
    constructor() {
        super();
        this._convertedData = {};
        this._data = undefined;
    }

    static get observedAttributes() { 
        return [
            "render", "publisher", "version", "articledoi", "articleid", "loading", "annotator", "queryurl"
        ]; 
    }

    get render() {
        return (this.getAttribute("render"));
    }
    
    get publisher() {
        return (this.getAttribute("publisher"));
    }

    get version() {
        return (this.getAttribute("version"));
    }

    get articledoi() {
        return (this.getAttribute("articledoi"));
    }

    get articleid() {
        return (this.getAttribute("articleid"));
    }

    get loading() {
        return (this.getAttribute("loading"));
    }

    get annotator() {
        return (this.getAttribute("annotator"));
    }

    get queryurl() {
        return (this.getAttribute("queryurl"));
    }

    set render(value) {
        this.setAttribute("render", value);
    }

    set publisher(value) {
        this.setAttribute("publisher", value);
    }

    set version(value) {
        this.setAttribute("version", value);
    }

    set articleid(value) {
        this.setAttribute("articleid", value);
    }

    set articledoi(value) {
        this.setAttribute("articledoi", value);
    }

    set loading(value) {
        this.setAttribute("loading", value);
    }

    set annotator(value) {
        this.setAttribute("annotator", value);
    }

    set queryurl(value) {
        this.setAttribute("queryurl", value);
    }

    getData() {
        return this._data;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if ((attrName === 'queryurl') && (newVal != undefined)) {
            this._fetchData();
        }
        this._parseData();
    }

    async _fetchData() {
        this.loading = 'on';
        const response = await fetch(this.queryurl);
        this._data = await response.json();
        this.loading = 'off';       
    }

    _parseData() {
        if (this._data != undefined) {  
            this.dispatchEvent(new CustomEvent(
                'load', {
                    detail: {
                        data: this._data
                    },
                    bubbles: true,
                    cancelable: true
                }
            ));
            this._convertedData = _clone(template, true);
            this._parseBasic();            
            this._parseAnnotations(this._data.text, this._data.denotations);
            if (this.render != null) {
                this._renderData();
            }
            this.dispatchEvent(new CustomEvent(
                'ready', {
                    detail: {
                        data: this._convertedData
                    },
                    bubbles: true,
                    cancelable: true
                }
            ));
        }
    }

    _parseBasic() {
        const now = new Date();
        this._convertedData.dateCreated = now.toISOString().split('T')[0];
        this._convertedData.sdPublisher = this.publisher;
        this._convertedData.version = this.version;
        this._convertedData.isBasedOn = 'http://pubannotation.org/projects/Biotea/docs/sourcedb/PMC/sourceid/' + this.articleid + '/annotations.json';
    }

    _parseAnnotations(text, data) {
        data.forEach((d) => {
            d.text = text.substring(d.span.begin, d.span.end);
        });
        data = _groupBy(data, 'text');
        this._convertedData.hasPart = [];
        _forEach(data, (value, key) => {
            this._convertedData.hasPart.push(this._createAnnotation(value, key));
        });
    }

    _createAnnotation(annText, text) {
        let myAnn = _clone(semAnn, true);
        myAnn.creator = this.annotator;
        myAnn.subjectOf = this.articledoi.indexOf('doi.org') !== -1 
            ? this.articledoi
            : 'https://doi.org/' + this.articledoi;
        myAnn.text = text;
        myAnn.mainEntity = [];
        annText.forEach((el) => {
            myAnn.mainEntity.push(this._createOntoTerm(el.obj));
        });
        myAnn.commentCount = myAnn.mainEntity.length;
        myAnn.mainEntity = _uniqWith(myAnn.mainEntity, _isEqual);
        myAnn.commentCount /= myAnn.mainEntity.length;
        return myAnn;
    }

    _createOntoTerm(term) {
        let myOntoTerm = _clone(ontoTerm, true);
        myOntoTerm.termCode = term;
        return myOntoTerm;
    }

    _renderData() {        
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.innerHTML = JSON.stringify(this._convertedData, null, 2);
        document.body.appendChild(s);        
    }    
}

customElements.define("biotea-bioschemas-annotations", BioteaBioschemasAnnotations);