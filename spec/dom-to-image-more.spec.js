/* eslint-disable no-undef */
(function (global) {
    'use strict';

    const $ = global.jQuery;
    const assert = global.chai.assert;
    const domtoimage = global.domtoimage;
    const Promise = global.Promise;
    const Tesseract = global.Tesseract;
    const BASE_URL = '/base/spec/resources/';

    describe('domtoimage', function () {
        afterEach(purgePage);

        it('should load', function () {
            assert.ok(domtoimage);
        });

        describe('regression', function () {
            it('should render to svg', function (done) {
                this.timeout(5000);
                loadTestPage(
                    'small/dom-node.html',
                    'small/style.css',
                    'small/control-image'
                )
                    .then(function () {
                        return domtoimage.toSvg(domNode());
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should render to png', function (done) {
                loadTestPage(
                    'small/dom-node.html',
                    'small/style.css',
                    'small/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode());
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should handle border', function (done) {
                loadTestPage(
                    'border/dom-node.html',
                    'border/style.css',
                    'border/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render to jpeg', function (done) {
                loadTestPage(
                    'small/dom-node.html',
                    'small/style.css',
                    'small/control-image-jpeg'
                )
                    .then(function () {
                        return domtoimage.toJpeg(domNode());
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should use quality parameter when rendering to jpeg', function (done) {
                loadTestPage(
                    'small/dom-node.html',
                    'small/style.css',
                    'small/control-image-jpeg-low'
                )
                    .then(function () {
                        return domtoimage.toJpeg(domNode(), { quality: 0.5 });
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should render to blob', function (done) {
                loadTestPage(
                    'small/dom-node.html',
                    'small/style.css',
                    'small/control-image'
                )
                    .then(function () {
                        return domtoimage.toBlob(domNode());
                    })
                    .then(function (blob) {
                        return global.URL.createObjectURL(blob);
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should render bigger node', function (done) {
                loadTestPage(
                    'bigger/dom-node.html',
                    'bigger/style.css',
                    'bigger/control-image'
                )
                    .then(function () {
                        const parent = $('#dom-node');
                        const child = $('.dom-child-node');
                        for (let i = 0; i < 10; i++) {
                            parent.append(child.clone());
                        }
                    })
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should handle "#" in colors and attributes', function (done) {
                loadTestPage(
                    'hash/dom-node.html',
                    'hash/style.css',
                    'small/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render nested svg with broken namespace', function (done) {
                this.timeout(5000);
                loadTestPage(
                    'svg-ns/dom-node.html',
                    'svg-ns/style.css',
                    'svg-ns/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render svg <rect> with width and heigth', function (done) {
                loadTestPage(
                    'svg-rect/dom-node.html',
                    'svg-rect/style.css',
                    'svg-rect/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render whole node when its scrolled', function (done) {
                let domNode;
                loadTestPage(
                    'scroll/dom-node.html',
                    'scroll/style.css',
                    'scroll/control-image'
                )
                    .then(function () {
                        domNode = $('#scrolled')[0];
                    })
                    .then(function () {
                        return renderToPng(domNode);
                    })
                    .then(makeImgElement)
                    .then(function (image) {
                        return drawImgElement(image, domNode);
                    })
                    .then(compareToControlImage)
                    .then(done)
                    .catch(done);
            });

            it('should render text nodes', function (done) {
                this.timeout(20000);
                loadTestPage('text/dom-node.html', 'text/style.css')
                    .then(renderToPng)
                    .then(drawDataUrl)
                    .then(assertTextRendered(['SOME TEXT', 'SOME MORE TEXT']))
                    .then(done)
                    .catch(done);
            });

            it('should preserve content of ::before and ::after pseudo elements', function (done) {
                this.timeout(10000);
                loadTestPage('pseudo/dom-node.html', 'pseudo/style.css', undefined)
                    .then(renderToPng)
                    .then(drawDataUrl)
                    .then(
                        assertTextRendered([
                            'AAA',
                            'Before BBB',
                            'CCC JustAfter',
                            'BothBefore DDD BothAfter',
                            'EEE',
                        ])
                    )
                    .then(done)
                    .catch(done);
            });

            it('should use node filter', function (done) {
                function filter(node) {
                    if (node.classList) {
                        return !node.classList.contains('omit');
                    }
                    return true;
                }

                loadTestPage(
                    'filter/dom-node.html',
                    'filter/style.css',
                    'filter/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode(), {
                            filter: filter,
                        });
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should not apply node filter to root node', function (done) {
                function filter(node) {
                    if (node.classList) {
                        return node.classList.contains('include');
                    }
                    return false;
                }

                loadTestPage(
                    'filter/dom-node.html',
                    'filter/style.css',
                    'filter/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode(), {
                            filter: filter,
                        });
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should render with external stylesheet', function (done) {
                loadTestPage(
                    'sheet/dom-node.html',
                    'sheet/style.css',
                    'sheet/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render web fonts', function (done) {
                loadTestPage(
                    'fonts/dom-node.html',
                    'fonts/style.css',
                    'fonts/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render images', function (done) {
                this.timeout(10000);
                loadTestPage('images/dom-node.html', 'images/style.css')
                    .then(renderToPng)
                    .then(drawDataUrl)
                    .then(assertTextRendered(['PNG', 'JPG']))
                    .then(done)
                    .catch(done);
            });

            it('should render background images', function (done) {
                this.timeout(10000);
                loadTestPage(
                    'css-bg/dom-node.html',
                    'css-bg/style.css',
                    'css-bg/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render iframe of street view', function (done) {
                this.timeout(60000);
                loadTestPage(
                    'iframe/street-view.html',
                    'iframe/style.css',
                    'iframe/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it('should render user input from <textarea>', function (done) {
                loadTestPage('textarea/dom-node.html', 'textarea/style.css')
                    .then(function () {
                        document.getElementById('input').value = 'USER\nINPUT';
                    })
                    .then(renderToPng)
                    .then(drawDataUrl)
                    .then(assertTextRendered(['USER\nINPUT']))
                    .then(done)
                    .catch(done);
            });

            it('should render user input from <input>', function (done) {
                loadTestPage('input/dom-node.html', 'input/style.css')
                    .then(function () {
                        document.getElementById('input').value = 'USER INPUT';
                    })
                    .then(renderToPng)
                    .then(drawDataUrl)
                    .then(assertTextRendered(['USER INPUT']))
                    .then(done)
                    .catch(done);
            });

            it('should render content from <canvas>', function (done) {
                loadTestPage('canvas/dom-node.html', 'canvas/style.css')
                    .then(function () {
                        const canvas = document.getElementById('content');
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#000000';
                        ctx.font = '100px monospace';
                        ctx.fillText('0', canvas.width / 2, canvas.height / 2);
                    })
                    .then(renderToPng)
                    .then(drawDataUrl)
                    .then(assertTextRendered(['0']))
                    .then(done)
                    .catch(done);
            });

            it('should handle zero-width <canvas>', function (done) {
                loadTestPage('canvas/empty-data.html', 'canvas/empty-style.css')
                    .then(function () {
                        const node = document.getElementById('dom-node');
                        domtoimage.toSvg(node).then(function (dataUrl) {
                            const img = new Image();
                            document.getElementById('result').appendChild(img);
                            img.src = dataUrl;
                        });
                    })
                    .then(done)
                    .catch(done);
            });

            it('should render bgcolor', function (done) {
                loadTestPage(
                    'bgcolor/dom-node.html',
                    'bgcolor/style.css',
                    'bgcolor/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode(), {
                            bgcolor: '#ffff00',
                        });
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should render bgcolor in SVG', function (done) {
                this.timeout(5000);
                loadTestPage(
                    'bgcolor/dom-node.html',
                    'bgcolor/style.css',
                    'bgcolor/control-image'
                )
                    .then(function () {
                        return domtoimage.toSvg(domNode(), {
                            bgcolor: '#ffff00',
                        });
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should not crash when loading external stylesheet causes error', function (done) {
                loadTestPage('ext-css/dom-node.html', 'ext-css/style.css')
                    .then(renderToPng)
                    .then(function () {
                        done();
                    })
                    .catch(done);
            });

            it('should convert an element to an array of pixels', function (done) {
                loadTestPage('pixeldata/dom-node.html', 'pixeldata/style.css')
                    .then(function () {
                        return domtoimage.toPixelData(domNode());
                    })
                    .then(function (pixels) {
                        for (let y = 0; y < domNode().scrollHeight; ++y) {
                            for (let x = 0; x < domNode().scrollWidth; ++x) {
                                const rgba = [0, 0, 0, 0];

                                if (y < 10) {
                                    rgba[0] = 255;
                                } else if (y < 20) {
                                    rgba[1] = 255;
                                } else {
                                    rgba[2] = 255;
                                }

                                if (x < 10) {
                                    rgba[3] = 255;
                                } else if (x < 20) {
                                    rgba[3] = parseInt(0.4 * 255);
                                } else {
                                    rgba[3] = parseInt(0.2 * 255);
                                }

                                const offset = 4 * y * domNode().scrollHeight + 4 * x;
                                assert.deepEqual(
                                    Uint8Array.from(pixels.slice(offset, offset + 4)),
                                    Uint8Array.from(rgba)
                                );
                            }
                        }
                    })
                    .then(done)
                    .catch(done);
            });

            it('should apply width and height options to node copy being rendered', function (done) {
                loadTestPage(
                    'dimensions/dom-node.html',
                    'dimensions/style.css',
                    'dimensions/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode(), {
                            width: 200,
                            height: 200,
                        });
                    })
                    .then(function (dataUrl) {
                        return drawDataUrl(dataUrl, { width: 200, height: 200 });
                    })
                    .then(compareToControlImage)
                    .then(done)
                    .catch(done);
            });

            it('should apply style text to node copy being rendered', function (done) {
                loadTestPage(
                    'style/dom-node.html',
                    'style/style.css',
                    'style/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode(), {
                            style: {
                                'background-color': 'red',
                                'transform': 'scale(0.5)',
                            },
                        });
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should apply handle background-clip:text', function (done) {
                loadTestPage(
                    'background-clip/dom-node.html',
                    'background-clip/style.css',
                    'background-clip/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode());
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should combine dimensions and style', function (done) {
                loadTestPage(
                    'scale/dom-node.html',
                    'scale/style.css',
                    'scale/control-image'
                )
                    .then(function () {
                        return domtoimage.toPng(domNode(), {
                            width: 200,
                            height: 200,
                            style: {
                                'transform': 'scale(2)',
                                'transform-origin': 'top left',
                            },
                        });
                    })
                    .then(function (dataUrl) {
                        return drawDataUrl(dataUrl, { width: 200, height: 200 });
                    })
                    .then(compareToControlImage)
                    .then(done)
                    .catch(done);
            });

            it('should render svg style attributes', function (done) {
                loadTestPage(
                    'svg-styles/dom-node.html',
                    'svg-styles/style.css',
                    'svg-styles/control-image'
                )
                    .then(function () {
                        return domtoimage.toSvg(domNode());
                    })
                    .then(check)
                    .then(done)
                    .catch(done);
            });

            it('should honor zero-padding table elements', function (done) {
                this.timeout(5000);
                loadTestPage(
                    'padding/dom-node.html',
                    'padding/style.css',
                    'padding/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    .catch(done);
            });

            it.skip('should render open shadow DOM roots with assigned nodes intact', function (done) {
                this.timeout(60000);
                loadTestPage(
                    'shadow-dom/dom-node.html',
                    'shadow-dom/styles.css',
                    'shadow-dom/control-image'
                )
                    .then(renderAndCheck)
                    .then(done)
                    //.catch(delay(50000))
                    .catch(done);
            });

            /*
            function delay(ms) {
                return function (arg) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(arg);
                        }, ms);
                    });
                };
            }
            */

            it('should not get fooled by math elements', function (done) {
                this.timeout(5000);
                loadTestPage('math/dom-node.html', null, 'math/control-image')
                    .then(function () {
                        return domtoimage.toPng(domNode(), { width: 500, height: 100 });
                    })
                    .then(function (dataUrl) {
                        return drawDataUrl(dataUrl, { width: 500, height: 100 });
                    })
                    .then(compareToControlImage)
                    .then(done)
                    .catch(done);
            });

            function compareToControlImage(image) {
                const imageUrl = getImageDataURL(image, 'image/png');
                const controlUrl = getImageDataURL(controlImage(), 'image/png');

                if (imageUrl !== controlUrl) {
                    console.log(`        image: ${image.src}`);
                    console.log(`  imageBase64: ${imageUrl}`);
                    console.log(`controlBase64: ${controlUrl}`);
                }
                assert.equal(
                    imageUrl,
                    controlUrl,
                    'rendered and control images should be same'
                );
            }

            function getImageDataURL(image, mimetype) {
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.height = image.naturalHeight;
                canvas.width = image.naturalWidth;
                canvas.imageSmoothingEnabled = false;
                context.drawImage(image, 0, 0);
                return canvas.toDataURL(mimetype);
            }

            function renderAndCheck() {
                return Promise.resolve().then(renderToPng).then(check);
            }

            function check(dataUrl) {
                return Promise.resolve(dataUrl)
                    .then(drawDataUrl)
                    .then(compareToControlImage);
            }

            function drawDataUrl(dataUrl, dimensions) {
                return Promise.resolve(dataUrl)
                    .then(makeImgElement)
                    .then(function (image) {
                        return drawImgElement(image, null, dimensions);
                    });
            }

            function assertTextRendered(lines) {
                return function () {
                    return new Promise(function (resolve, reject) {
                        Tesseract.recognize(canvas()).then(function (result) {
                            lines.forEach(function (line) {
                                try {
                                    assert.include(result.text, line);
                                } catch (e) {
                                    console.log(result.text);
                                    reject(e);
                                }
                            });
                            resolve();
                        });
                    });
                };
            }

            function makeImgElement(src) {
                return new Promise(function (resolve, reject) {
                    const image = new Image();
                    image.onload = function () {
                        resolve(image);
                    };
                    image.onerror = function (ev) {
                        reject(ev);
                    };
                    image.src = src;
                });
            }

            function drawImgElement(image, node, dimensions) {
                node = node || domNode();
                dimensions = dimensions || {};
                const c = canvas();
                c.height = dimensions.height || node.offsetHeight.toString();
                c.width = dimensions.width || node.offsetWidth.toString();
                c.getContext('2d').imageSmoothingEnabled = false;
                c.getContext('2d').drawImage(image, 0, 0);
                return image;
            }
        });

        describe('inliner', function () {
            const NO_BASE_URL = null;

            it('should parse urls', function () {
                const parse = domtoimage.impl.inliner.impl.readUrls;

                assert.deepEqual(parse('url("http://acme.com/file")'), [
                    'http://acme.com/file',
                ]);
                // eslint-disable-next-line quotes
                assert.deepEqual(parse("url(foo.com), url('bar.org')"), [
                    'foo.com',
                    'bar.org',
                ]);
            });

            it('should ignore data urls', function () {
                const parse = domtoimage.impl.inliner.impl.readUrls;

                assert.deepEqual(parse('url(foo.com), url(data:AAA)'), ['foo.com']);
            });

            it('should inline url', function (done) {
                const inline = domtoimage.impl.inliner.impl.inline;

                inline(
                    'url(http://acme.com/image.png), url(foo.com)',
                    'http://acme.com/image.png',
                    NO_BASE_URL,
                    function () {
                        return Promise.resolve('data:image/png;base64,AAA');
                    }
                )
                    .then(function (result) {
                        assert.equal(
                            result,
                            'url(data:image/png;base64,AAA), url(foo.com)'
                        );
                    })
                    .then(done)
                    .catch(done);
            });

            it('should resolve urls if base url given', function (done) {
                const inline = domtoimage.impl.inliner.impl.inline;

                inline(
                    'url(images/image.png)',
                    'images/image.png',
                    'http://acme.com/',
                    function (url) {
                        return Promise.resolve(
                            {
                                'http://acme.com/images/image.png':
                                    'data:image/png;base64,AAA',
                            }[url]
                        );
                    }
                )
                    .then(function (result) {
                        assert.equal(result, 'url(data:image/png;base64,AAA)');
                    })
                    .then(done)
                    .catch(done);
            });

            it('should inline all urls', function (done) {
                const inlineAll = domtoimage.impl.inliner.inlineAll;

                inlineAll(
                    'url(http://acme.com/image.png), url("foo.com/font.ttf")',
                    NO_BASE_URL,
                    function (url) {
                        return Promise.resolve(
                            {
                                'http://acme.com/image.png': 'data:image/png;base64,AAA',
                                'foo.com/font.ttf':
                                    'data:application/font-truetype;base64,BBB',
                            }[url]
                        );
                    }
                )
                    .then(function (result) {
                        assert.equal(
                            result,
                            'url(data:image/png;base64,AAA), url("data:application/font-truetype;base64,BBB")'
                        );
                    })
                    .then(done)
                    .catch(done);
            });
        });

        describe('util', function () {
            it('should get and encode resource', function (done) {
                const getAndEncode = domtoimage.impl.util.getAndEncode;
                getResource('util/fontawesome.base64')
                    .then(function (testResource) {
                        return getAndEncode(`${BASE_URL}util/fontawesome.woff2`).then(
                            function (resource) {
                                assert.equal(resource, testResource);
                            }
                        );
                    })
                    .then(done)
                    .catch(done);
            });

            it('should return empty result if cannot get resource', function (done) {
                domtoimage.impl.util
                    .getAndEncode(`${BASE_URL}util/not-found`)
                    .then(function (resource) {
                        assert.equal(resource, '');
                    })
                    .then(done)
                    .catch(done);
            });

            it('should return placeholder result if cannot get resource and placeholder is provided', function (done) {
                const placeholder =
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY7h79y4ABTICmGnXPbMAAAAASUVORK5CYII=';
                const original = domtoimage.impl.options.imagePlaceholder;
                domtoimage.impl.options.imagePlaceholder = placeholder;
                domtoimage.impl.util
                    .getAndEncode(`${BASE_URL}util/image-not-found`)
                    .then(function (resource) {
                        const placeholderData = placeholder.split(/,/)[1];
                        assert.equal(resource, placeholderData);
                        domtoimage.impl.options.imagePlaceholder = original;
                    })
                    .then(done)
                    .catch(done);
            });

            it('should resolve url', function () {
                const resolve = domtoimage.impl.util.resolveUrl;

                assert.equal(
                    resolve('font.woff', 'http://acme.com'),
                    'http://acme.com/font.woff'
                );
                assert.equal(
                    resolve('/font.woff', 'http://acme.com/fonts/woff'),
                    'http://acme.com/font.woff'
                );

                assert.equal(
                    resolve('../font.woff', 'http://acme.com/fonts/woff/'),
                    'http://acme.com/fonts/font.woff'
                );
                assert.equal(
                    resolve('../font.woff', 'http://acme.com/fonts/woff'),
                    'http://acme.com/font.woff'
                );
            });

            it('should generate distinct uids', function () {
                const uid1 = domtoimage.impl.util.uid();
                assert(uid1.length >= 4);
                const uid2 = domtoimage.impl.util.uid();
                assert(uid2.length >= 4);
                assert.notEqual(uid1, uid2);
            });
        });

        describe('web fonts', function () {
            const fontFaces = domtoimage.impl.fontFaces;

            it('should read non-local font faces', function (done) {
                loadTestPage('fonts/web-fonts/empty.html', 'fonts/web-fonts/rules.css')
                    .then(function () {
                        return fontFaces.impl.readAll();
                    })
                    .then(function (webFonts) {
                        assert.equal(webFonts.length, 3);
                        const sources = webFonts.map(function (webFont) {
                            return webFont.src();
                        });
                        assertSomeIncludesAll(sources, [
                            'http://fonts.com/font1.woff',
                            'http://fonts.com/font1.woff2',
                        ]);
                        assertSomeIncludesAll(sources, [
                            'http://fonts.com/font2.ttf?v1.1.3',
                        ]);
                        assertSomeIncludesAll(sources, ['data:font/woff2;base64,AAA']);
                    })
                    .then(done)
                    .catch(done);
            });

            function assertSomeIncludesAll(haystacks, needles) {
                const found = haystacks.some(function (haystack) {
                    return needles.every(function (needle) {
                        return haystack.indexOf(needle) !== -1;
                    });
                });
                if (!found) {
                    assert.fail(
                        `\nnone of\n[ ${haystacks.join(
                            '\n'
                        )} ]\nincludes all of \n[ ${needles.join(', ')} ]\n`
                    );
                }
            }
        });

        describe('images', function () {
            it('should not inline images with data url', function (done) {
                const originalSrc = 'data:image/jpeg;base64,AAA';
                const img = new Image();
                img.src = originalSrc;

                domtoimage.impl.images.impl
                    .newImage(img)
                    .inline(function () {
                        return Promise.resolve('XXX');
                    })
                    .then(function () {
                        assert.equal(img.src, originalSrc);
                    })
                    .then(done)
                    .catch(done);
            });
        });

        describe('styles', function () {
            it('should compute correct keys', function (done) {
                this.timeout(30000);
                let one = Promise.allSettled([
                    loadTestPage(
                        'padding/dom-node.html',
                        'padding/style.css',
                        'padding/control-image'
                    ).then((node) => renderToSvg(node, { styleCaching: 'strict' })),
                ]).then((promises) => promises[0].value);
                let two = Promise.allSettled([
                    loadTestPage(
                        'padding/dom-node.html',
                        'padding/style.css',
                        'padding/control-image'
                    ).then((node) => renderToSvg(node, { styleCaching: 'relaxed' })),
                ]).then((promises) => promises[0].value);

                Promise.allSettled([one, two])
                    .then(function (promises) {
                        const strict = promises[0].value;
                        const relaxed = promises[1].value;
                        if (strict !== relaxed) {
                            console.log(
                                `\n\nstrict: ${strict}\n\nrelaxed: ${relaxed}\n\n`
                            );
                        }
                        assert.equal(strict, relaxed, 'SVG rendered be same');
                    })
                    .then(done)
                    .catch(done);
            });
        });

        function loadTestPage(html, css, controlImage) {
            return loadPage()
                .then(function (document) {
                    if (!html) return document;

                    return getResource(html).then(function (html) {
                        $('#dom-node').html(html);
                        return document;
                    });
                })
                .then(function (document) {
                    if (!css) return document;

                    return getResource(css).then(function (css) {
                        $('#style').append(document.createTextNode(css));
                        return document;
                    });
                })
                .then(function (document) {
                    if (!controlImage) return document;

                    return getResource(controlImage).then(function (image) {
                        $('#control-image').attr('src', image);
                        return document;
                    });
                });
        }

        function loadPage() {
            return getResource('page.html').then(function (html) {
                const root = document.createElement('div');
                root.id = 'test-root';
                root.innerHTML = html;
                document.body.appendChild(root);
                return document;
            });
        }

        function purgePage() {
            const root = $('#test-root');
            if (root) {
                root.remove();
            }
        }

        function domNode() {
            return $('#dom-node')[0];
        }

        function clonedNode() {
            return $('#cloned-node')[0];
        }

        function controlImage() {
            return $('#control-image')[0];
        }

        function canvas() {
            return $('#canvas')[0];
        }

        function getResource(fileName) {
            const url = BASE_URL + fileName;
            const request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'text';

            return new Promise(function (resolve, reject) {
                request.onload = function () {
                    if (this.status === 200) {
                        resolve(request.response.toString().trim());
                    } else {
                        reject(new Error(`cannot load ${url}`));
                    }
                };
                request.send();
            });
        }

        function renderToPng() {
            return domtoimage.toPng(domNode(), { onclone: cloneCatcher });
        }

        function renderToSvg(options) {
            const debugOptions = { onclone: cloneCatcher, debugCache: true };
            return domtoimage.toSvg(domNode(), Object.assign(debugOptions, options));
        }

        function cloneCatcher(clone) {
            clonedNode().replaceChildren(clone);
            return clone;
        }
    });
})(this);
