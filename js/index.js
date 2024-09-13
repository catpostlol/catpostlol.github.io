const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://catpostlol.github.io/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});
const tonweb = new window.TonWeb();
var converter = new showdown.Converter();
const Address = tonweb.utils.Address;

console.log(location.hash.replace("#", ""));

let lhash = location.hash.replace("#", "")
let limit = 999;
let address;
function renderPost(change_addr=true) {
    if (lhash) {
        if (lhash.startsWith("tx")) {
            document.getElementById("answers").innerHTML = '';
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 
            `https://toncenter.com/api/v3/transactions?hash=${lhash.replace("tx", "")}&limit=1&offset=0`, false);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    let transactions = JSON.parse(xhr.response);
                    console.log(address)
                    address = new Address(transactions.transactions[0].account)
                    document.getElementById("post-address").innerText = escapeString(address.toString(isUserFriendly=true));
                    document.getElementById("post-address").onclick = function () {
                        location.hash = address.toString(isUserFriendly=true)
                        document.getElementById("address").innerText = escapeString(address.toString(isUserFriendly=true));
                        document.getElementById("address").href = `https://tonscan.org/address/${escapeString(address.toString(isUserFriendly=true))}`;
                        renderAddress(address.toString())
                    }
                    console.log(transactions)
                    console.log(transactions.transactions[0].account)
                    let ts = escapeString(new Date(parseInt(transactions.transactions[0].out_msgs[0].created_at + "000")).toLocaleString())
                    document.getElementById("post-timestamp").textContent = ts;
                    console.log(ts)
                    document.getElementById("post-html1").innerHTML = DOMPurify.sanitize(
                        converter.makeHtml(
                            escapeString(transactions.transactions[0].out_msgs[0].message_content.decoded.comment
                                .replace("ctpst:p:", ""))), {ADD_TAGS: ['blockquote']});
                    document.getElementById("post-window").style.display = 'block';

                }
            }
            xhr.send();
            const xhr2 = new XMLHttpRequest();
            xhr2.open('GET', 
            `https://toncenter.com/api/index/getTransactionsByAddress?address=${
                address.toString(isUserFriendly=false)}&limit=${limit}&offset=0`, true);
    
            xhr2.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    let transactions2 = JSON.parse(xhr2.response);
                    let posts_div = document.getElementById("answers")
                    for (i of transactions2) {
                        if (i.in_msg.source != "") {
                            if (i.in_msg.comment.startsWith("ctpst:a:"+lhash.replace("tx", "")+":") && 
                            i.in_msg.comment.replace(("ctpst:a:"+lhash.replace("tx", "")+":"), "").length <= 200) {
                                console.log(i)
                                let ts = escapeString(new Date(parseInt(i.utime + "000")).toLocaleString())
                                let post = document.createElement('div');
                                let posthtml = document.createElement('div');
                                posthtml.classList = ["post-html"];
                                post.classList = ["post"];
                                posthtml.innerHTML = DOMPurify.sanitize(
                                    escapeString(i.in_msg.comment.replace(("ctpst:a:"+lhash.replace("tx", "")+":"), ""))),
                                    {ADD_TAGS: ['blockquote']};
                                let timestamp = document.createElement("p");
                                timestamp.textContent = ts;
                                let author = document.createElement("p");
                                author.textContent = escapeString(i.in_msg.source);
                                author.onclick = function () {
                                    location.hash = this.innerText;
                                    document.getElementById("address").innerText = escapeString(this.innerText);
                                    document.getElementById("address").href = `https://tonscan.org/address/${escapeString(this.innerText)}`;
                                    renderAddress(this.innerText)
                                }
                                post.prepend(posthtml);
                                post.prepend(timestamp);
                                post.prepend(author);
                                posts_div.prepend(post);
                            }
                        }
                    }
                } else {
                    console.log('Request failed with status: ' + xhr.status, null);
                }
            };
            xhr2.send();
            
        } else {
            document.getElementById("address").innerText = escapeString(lhash);
            document.getElementById("address").href = `https://tonscan.org/address/${escapeString(lhash)}`;
            renderAddress();
        }
    } else {
        document.getElementById("text-editor-window").style.display = 'block';
    }
}
renderPost()
async function renderAddress(adr) {
    document.getElementById("text-editor-window").style.display = 'none';
    document.getElementById("post-window").style.display = 'none';
    document.getElementById("account-window").style.display = 'block';
    document.getElementById("posts").innerHTML = "";
    let address = adr;
    if (!adr) {
        address = new Address(lhash)
    }
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 
    `https://toncenter.com/api/index/getTransactionsByAddress?
address=${address.toString(isUserFriendly=false)}&limit=${limit}&offset=0`, true);
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            transactions = JSON.parse(xhr.response);
            console.log(transactions)
            let posts_div = document.getElementById("posts")
            for (i of transactions) {
                if (i.out_msgs.length) {
                    let ts = escapeString(new Date(parseInt(i.utime + "000")).toLocaleString())
                    for (j of i.out_msgs) {
                        if (j.comment && j.comment.startsWith("ctpst:p:")) {
                            console.log(i)
                            let post = document.createElement('div');
                            let tmp = i.hash
                            post.onclick = function () {
                                location.hash="tx"+tmp.replace("+", "-");
                                lhash = location.hash.replace("#", "");
                                document.getElementById("account-window").style.display = 'none';
                                document.getElementById("post-window").style.display = 'block';
                                renderPost();
                            }
                            let posthtml = document.createElement('div');
                            posthtml.classList = ["post-html"];
                            post.classList = ["post"];
                            posthtml.innerHTML = DOMPurify.sanitize(
                                converter.makeHtml(
                                    escapeString(j.comment.replace("ctpst:p:", ""))), {ADD_TAGS: ['blockquote']});
                            let timestamp = document.createElement("p");
                            timestamp.textContent = ts;
                            post.prepend(posthtml);
                            post.prepend(timestamp);
                            posts_div.prepend(post);
                        }
                    }
                }
            }
        } else {
            console.log('Request failed with status: ' + xhr.status, null);
        }
    };
    xhr.send();
};

document.getElementById("profilebt").onclick = function () {
    address = new Address(tonConnectUI.account.address)
    location.hash = address.toString(isUserFriendly=true)
    document.getElementById("address").innerText = escapeString(address.toString(isUserFriendly=true));
    document.getElementById("address").href = `https://tonscan.org/address/${escapeString(address.toString(isUserFriendly=true))}`;
    renderAddress(address.toString())
}
document.getElementById("logo").onclick = function () {
    location.hash = '';
    document.getElementById("post-window").style.display = 'none';
    document.getElementById("account-window").style.display = 'none';
    document.getElementById("text-editor-window").style.display = 'block';
}
let localStorage1 = window.localStorage;
let images = [];
if (localStorage1.getItem("images")) {
    images = JSON.parse(localStorage1.getItem("images"));
    updateImgList();
}
var simplemde = new SimpleMDE({
    autosave: {
        enabled: true,
        uniqueId: "textarea",
        delay: 1000,
    }, 
    status: false,
    spellChecker: false,
    previewRender: function(plainText) {
        let imgi = 0;
        let result = plainText;
        while (imgi < images.length) {
            result = result.replace(`(✨)`, "(data:image/png;base64,"+images[imgi].base64+")");
            console.log(result)
            imgi++;
        }
        console.log(
            DOMPurify.sanitize(
                converter.makeHtml(
                    escapeString(result)), {ADD_TAGS: ['blockquote']}))
        return DOMPurify.sanitize(
            converter.makeHtml(
                escapeString(result)), {ADD_TAGS: ['blockquote']});
    },
    toolbar: ["bold", "italic", "heading", "|", 
                "quote", "unordered-list", "ordered-list", "|",
                "link", {
                    name: "Insert Image",
                    action: function () {
                        document.getElementById("imagePicker").style.display = "flex";
                    },
                    className: "fa fa-picture-o",
                    title: "Insert Image",
                }, "horizontal-rule", "|", "preview"]
});

function escapeString(str) {
    return str.replace(/[&<"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

function hideImagePicker() {
    document.getElementById("imagePicker").style.display = "none";
    document.getElementById('fileId').value = '';
}
function closeSearch() {
    document.getElementById("searchWindow").style.display = "none";
}
document.getElementById("searchbt").onclick = function () {
    document.getElementById("searchWindow").style.display = "flex";
}
function findSubstringIndices(str, regex) {
    let results = [];
    let match;
    regex = new RegExp(regex, 'g');
    
    while ((match = regex.exec(str)) !== null) {
        let startIndex = match.index;
        results.push({ startIndex, length: match[0].length });
    }
    
    return results;
}
function cutSubstring(str, index, length) {
    return str.slice(0, index) + str.slice(index + length);
}
const magicImgRegex = /<img alt="[^"]*" src="✨">/g;
const magicImgMdRegex = /\!\[(.*?)\]\(✨\)/g;

function updateImgList() {
    document.getElementById("images").innerHTML = "";
    localStorage1.setItem("images", JSON.stringify(images));
    for (i = 0; i < images.length; i++) {
        let imageDiv = document.createElement('div');
        imageDiv.className = 'image';

        let paragraph = document.createElement('p');
        paragraph.textContent = i+1 + ". " + images[i].name;

        let button = document.createElement('button');
        button.id = `delete${i}`;
        button.classList = ['mybutton'];
        button.onclick = function () {
            let html = DOMPurify.sanitize(
                converter.makeHtml(
                    escapeString(
                        simplemde.value())));
            let goal = this.id.replace("delete", "");
            images.splice(goal, 1);
            indices = findSubstringIndices(simplemde.value(), magicImgMdRegex);
            console.log(indices)
            try {
                console.log(cutSubstring(simplemde.value(), indices[goal].startIndex, indices[goal].length));
                simplemde.value(cutSubstring(simplemde.value(), indices[goal].startIndex, indices[goal].length));
            } catch {}
            button.parentElement.remove();
            updateImgList()
        }
        button.textContent = 'Удалить';

        imageDiv.appendChild(paragraph);
        imageDiv.appendChild(button);
        document.getElementById("images").appendChild(imageDiv);
    }
}

function imageUploaded() {
    let file = document.querySelector(
        'input[type=file]')['files'][0];

    let reader = new FileReader();
    console.log("next");

    reader.onload = function () {
        base64String = reader.result.replace("data:", "")
            .replace(/^.+,/, "");
        images.push({base64: base64String, name: file.name});
        simplemde.value(simplemde.value()+`\n![](✨)`);
        hideImagePicker();
        updateImgList();
    }
    reader.readAsDataURL(file);
}

function writeStringTail(str, cell) {
    let bytes = Math.floor(cell.bits.getFreeBits() / 32);
    let remainingStr = str;
    let currentCell = cell;

    while (remainingStr.length > 0) {
        let part = remainingStr.substring(0, bytes);
        remainingStr = remainingStr.substring(bytes);

        currentCell.bits.writeString(part);

        if (remainingStr.length > 0) {
            let newCell = new TonWeb.boc.Cell();
            currentCell.refs.push(newCell);
            currentCell = newCell;
        }
    }

    return cell;
}

document.getElementById("send").onclick = async function () {
    if (!simplemde.value()) return;
    let imgi = 0;
    let tmp = simplemde.value();
    while (imgi < images.length) {
        tmp = tmp.replace(`(✨)`, "(data:image/png;base64,"+images[imgi].base64+")");
        console.log(tmp)
        imgi++;
    }
    let cell = new TonWeb.boc.Cell();
    cell.bits.writeUint(0, 32);
    let str = "ctpst:p:"+tmp;
    cell = writeStringTail(str, cell);
    let transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        messages: [{address: "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ",
                    amount: 1, payload: tonweb.utils.bytesToBase64(await cell.toBoc())}]
    }
    console.log(transaction)
    let result = await tonConnectUI.sendTransaction(transaction);
}
document.getElementById("commentbt").onclick = async function () {
    if (!document.getElementById("comment").value) return;
    if (document.getElementById("comment").value.length > 200) return;
    let tmp = document.getElementById("comment").value;
    let cell = new TonWeb.boc.Cell();
    cell.bits.writeUint(0, 32);
    let str = "ctpst:a:"+lhash.replace("tx", "")+":"+tmp;
    cell = writeStringTail(str, cell);
    let transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 3600,
        messages: [{address: address.toString(isUserFriendly=false),
                    amount: 1, payload: tonweb.utils.bytesToBase64(await cell.toBoc())}]
    }
    console.log(transaction)
    let result = await tonConnectUI.sendTransaction(transaction);
    document.getElementById("comment").value = "";
}
const counter = document.getElementById("counter");
function updateCounter() {
    counter.innerText = document.getElementById("comment").value.length+"/200"
    if (document.getElementById("comment").value.length <= 200) {
        document.getElementById("counter").style.color = "black";
    } else {
        document.getElementById("counter").style.color = "red";
    }
}
updateCounter();
document.getElementById("comment").addEventListener('input', updateCounter);
document.getElementById("search-input").addEventListener('input', function () {
    try {
        let check = new Address(document.getElementById("search-input").value);
        address = check
        location.hash = address.toString(isUserFriendly=true)
        document.getElementById("address").innerText = escapeString(address.toString(isUserFriendly=true));
        document.getElementById("address").href = `https://tonscan.org/address/${escapeString(address.toString(isUserFriendly=true))}`;
        document.getElementById("search-input").value = "";
        closeSearch();
        renderAddress(address);
    } catch (e){
        console.error(e)
    }
})
setInterval(() => {
    if (tonConnectUI.connected) {
        document.getElementById("send").style.display = 'block';
        document.getElementById("comment-wallet-warn").style.display = 'none';
        document.getElementById("commentbt").style.display = 'block';
        document.getElementById("profilebt").style.display = 'block';
    } else {
        document.getElementById("send").style.display = 'none';
        document.getElementById("comment-wallet-warn").style.display = 'block';
        document.getElementById("commentbt").style.display = 'none';
        document.getElementById("profilebt").style.display = 'none';
    }
}, 100);
